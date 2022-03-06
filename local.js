require('dotenv').config();

const main = async () => {
    const { app } = await import("./app.mjs");
    app();
};

main();