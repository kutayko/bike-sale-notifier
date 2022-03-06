import { parse } from 'node-html-parser';
import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const BIKE_LIST_URL = process.env.BIKE_LIST_URL;
const BIKE_TOP_URL = process.env.BIKE_TOP_URL;

const main = async () => {
    console.log(BIKE_LIST_URL);
    const response = await fetch(BIKE_LIST_URL);
    const body = await response.text();

    const products = parse(body)
        .querySelectorAll('.product-tile')
        .map(p => parseProduct(p))
        .filter(p => p.price < 200);

    const productsWithSizes = await fetchSizes(products);

    const bot = new TelegramBot(BOT_TOKEN);
    bot.sendMessage(
        CHAT_ID,
        serialize(productsWithSizes),
        { parse_mode: "MarkdownV2", disable_web_page_preview: true }
    ).catch((error) => {
        console.log(error.code);  // => 'ETELEGRAM'
        console.log(error.response.body); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
    });
};

const parseProduct = (product) => ({
    name: product.querySelector('.product-name').innerHTML.replace(/[\n\t\r]/g, ""),
    price: getPrice(product),
    url: BIKE_TOP_URL + product.querySelector('.thumb-link').getAttribute("href")
});

const getPrice = (product) => {
    return parseInt(
        product.querySelector('.price-sales').innerHTML
            .split(" ")[1]
            .split(",")[0]
            .replace(/[\n\t\r]/g, "")
            .replace(/[\.]/g, "")
    );
}

const fetchProductSizes = async (product) => {
    const response = await fetch(product.url);
    const body = await response.text();

    return parse(body)
        .querySelectorAll('.variation__option')
        .map(v => ({
            size: v.getAttribute('data-variationvalue').split(" ")[0],
            availability: v.getAttribute('data-availability')
        }))
        .filter(v => v.availability != 'Ausverkauft')
        .map(v => v.size);
}

const fetchSizes = (products) => {
    const promises = products.map(async (p) => ({ ...p, sizes: await fetchProductSizes(p) }));
    return Promise.all(promises);
}

const serialize = (products) => products
    .map(p => [
            `${p.name}`,
            `€ ${p.price}`,
            `${ p.sizes.join(", ") }`,
            `[link](${p.url})`
        ].join("\n")
    ).join("\n\n");

main();