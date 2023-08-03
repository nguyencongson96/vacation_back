import sharp from 'sharp';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const resize = ({ type }) => {
  const path = path.join(__dirname, '..', resource);
  switch (type) {
    case 'avatar':
      return sharp(path).resize(50, 50, { fit: 'outside', withoutReduction: false });

    default:
      break;
  }
};

export default resize;
