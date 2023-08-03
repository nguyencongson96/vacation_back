const _throw = ({ errors, meta, message, code }) => {
  !message && (message = '');
  !code && (code = 500);
  !meta && (meta = '');
  !errors && (errors = '');
  throw { errors, meta, code, message };
};

export default _throw;
