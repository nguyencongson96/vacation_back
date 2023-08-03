import Notifications from '#root/model/interaction/notification';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import { getResourcePath } from '#root/config/pipeline';
import mongoose from 'mongoose';
import { firestore } from '#root/app';
import {
  collection,
  Timestamp,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';

const notiController = {
  getMany: asyncWrapper(async (req, res) => {
    //Get userId from verify JWT middelware
    const userId = req.userInfo._id;
    const notiRef = collection(firestore, 'notifications');
    const itemPerPage = process.env.ITEM_OF_PAGE;

    //Throw an error if page is undefined or not a number
    const page = Number(req.query.page) || 1;
    page < 0 &&
      _throw({
        code: 400,
        errors: [{ field: 'page', message: 'invalid' }],
        message: 'page query must be a positive number',
      });

    let queryCondition;
    //If page is first page
    if (page === 1) {
      // Query the first page of docs
      queryCondition = query(
        notiRef,
        where('receiverId', '==', userId.toString()),
        orderBy('lastUpdateAt', 'desc'),
        limit(itemPerPage)
      );
    }

    //If page is not first page
    else {
      // Query the first page of docs
      const first = query(
        notiRef,
        where('receiverId', '==', userId.toString()),
        orderBy('lastUpdateAt', 'desc'),
        limit((page - 1) * itemPerPage)
      );

      //Send to front code 204 if result is empty array
      const foundNoti = (await getDocs(first)).docs;
      if (foundNoti.length === 0) return res.sendStatus(204);

      // Get the last visible document
      const lastVisible = foundNoti[foundNoti.length - 1];

      // Construct a new query starting at this document,
      queryCondition = query(
        notiRef,
        where('receiverId', '==', userId.toString()),
        orderBy('lastUpdateAt', 'desc'),
        startAfter(lastVisible),
        limit(itemPerPage)
      );
    }

    //Send to front code 204 if result is empty array
    const resultQuery = (await getDocs(queryCondition)).docs;
    if (resultQuery.length === 0) return res.sendStatus(204);

    //Restructure Object to send to front
    let result = [],
      totalUnseen = 0;
    const list = resultQuery.map(item => Object.assign({ id: item.id }, item.data()));

    for (const item of list) {
      const { senderId, isSeen, modelType, modelId, action, isFirst, lastUpdateAt } = item;
      let modelInfo = {};
      const userInfo = await mongoose
        .model('users')
        .aggregate(
          [].concat(
            { $match: { _id: new mongoose.Types.ObjectId(senderId) } },
            { $project: { username: 1 } },
            getResourcePath({ localField: '_id', as: 'avatar' })
          )
        );
      modelType === 'posts' &&
        (modelInfo = (await mongoose.model('posts').findById(modelId).select({ vacationId: 1, content: 1 }).lean()) || {});

      !isSeen && (totalUnseen += 1);
      result.push({
        id: item.id,
        modelInfo: Object.assign(modelInfo, { type: modelType }),
        userInfo: userInfo[0],
        action,
        isFirst,
        isSeen,
        lastUpdateAt,
      });
    }

    const totalDocs = (await getCountFromServer(query(notiRef, where('receiverId', '==', userId.toString())))).data().count;

    //Send to front
    return res.json({
      meta: { total: totalDocs, page, pages: Math.ceil(totalDocs / itemPerPage), totalUnseen },
      data: result,
    });
  }),

  updateContent: async ({ document, action }) => {
    let { modelType, modelId, userId, receiverId, senderId } = document;
    const notiRef = collection(firestore, 'notifications');

    if (action !== 'addFriend') {
      const foundPost = await mongoose.model('posts').findById(modelId);
      !foundPost && _throw({ code: 404, message: 'post cannot be found' });
      receiverId = foundPost.userId;
      senderId = userId;
    }

    //Do not create new Noti if author like his/her own modelType
    if (receiverId.toString() !== senderId.toString()) {
      const queryCondition = query(
        notiRef,
        where('modelType', '==', modelType),
        where('modelId', '==', modelId.toString()),
        where('receiverId', '==', receiverId.toString()),
        where('action', '==', action)
      );

      const foundNoti = (await getDocs(queryCondition)).docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
      //If Noti not found, create new Notification
      if (foundNoti.length === 0)
        await addDoc(notiRef, {
          modelType,
          modelId: modelId.toString(),
          senderId: senderId.toString(),
          receiverId: receiverId.toString(),
          lastUpdateAt: Timestamp.fromDate(new Date()),
          action: action,
          isSeen: false,
          isFirst: true,
        });
      //Update noti in case found
      else
        await updateDoc(doc(notiRef, foundNoti[0].id), {
          lastUpdateAt: serverTimestamp(),
          isSeen: false,
          isFirst: false,
          senderId: senderId.toString(),
        });
    }
  },

  updateStatusAll: asyncWrapper(async (req, res) => {
    const receiverId = req.userInfo._id;
    const notiRef = collection(firestore, 'notifications');

    const queryCondition = query(notiRef, where('receiverId', '==', receiverId.toString()));
    const foundNoti = (await getDocs(queryCondition)).docs.map(doc => Object.assign({ id: doc.id }, doc.data()));

    let result = [];
    for (const noti of foundNoti) {
      result.push(
        updateDoc(doc(notiRef, noti.id), {
          isSeen: true,
        })
      );
    }
    await Promise.all(result);

    //Send to front
    return res.status(200).json({ meta: { total: foundNoti.length }, message: 'update status of all post successfully' });
  }),

  updateStatusOne: asyncWrapper(async (req, res) => {
    const foundNoti = req.doc;
    const notiRef = collection(firestore, 'notifications');

    //Get document from previos middleware, Change seen Status to true and save to DB
    await updateDoc(doc(notiRef, foundNoti.id), {
      isSeen: true,
    });

    //Send to front
    return res.status(200).json({
      data: Object.assign(foundNoti, {
        isSeen: true,
      }),
      message: 'update status of one post successfully',
    });
  }),

  delete: async () => {
    //Config expired date
    const expDate = new Date(Date.now() - process.env.MAX_RANGE_NOTI);

    //Delete all Notifications that have been seen or exceed expired date in all users
    const deleteNoti = await Notifications.deleteMany({ $or: [{ isSeen: true }, { lastUpdateAt: { $lte: expDate } }] });

    //Return result
    return deleteNoti;
  },
};

export default notiController;
