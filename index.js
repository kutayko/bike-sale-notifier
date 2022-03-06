exports.handler = async (event, context) => {
  const { app } = await import('./app.mjs');
  return await app();
};