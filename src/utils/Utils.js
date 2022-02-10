const fs = require('fs');
require('dotenv').config();
const {
    parse,
    stringify
} = require('envfile');
const pathToenvFile = '.env';

/**
 *
 * @param {string} key
 * //Function to get value from env
 */
function getEnv(key) {
    console.log("Getting value of " + key);
    console.log(process.env[key]);
}


/**
 *
 * @param {string} key
 * @param {any} value
 * //Function to set environment variables.
 */
function setEnv(key, value) {
    fs.readFile(pathToenvFile, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = parse(data);
        result[key] = value;
        fs.writeFile(pathToenvFile, stringify(result), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("Saved .env file!"); // Can be commented or deleted
        })

    });
}

/**
 *
 * @param str{String}
 * @returns {string}
 */
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDayOfWeek(){
    return new Date().getDay();
}

function randomInt(max){
    return Math.floor(Math.random() * (max + 1));
}

Object.defineProperties(Array.prototype, {
    count: {
        value: function(value) {
            return this.filter(x => x==value).length;
        }
    }
});

module.exports = {
    setEnv,
    getEnv,
    capitalizeFirstLetter,
    getDayOfWeek,
    randomInt,
};