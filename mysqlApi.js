
'use strict';
const  mysql = require('mysql2/promise');

async function checkConnection(settings){
    try{
        let connection = await mysql.createConnection({
            host     : settings.host,
            port     : settings.port,
            user     : settings.user,
            password : settings.pw
        });

        await connection.connect();
        await connection.ping();     
        await connection.end();   
        return true;
    }
    catch (error){
        throw error;
    }
}

async function getDatabases(settings){
    try{
        let connection = await mysql.createConnection({
            host     : settings.host,
            port     : settings.port,
            user     : settings.user,
            password : settings.pw
        });

        await connection.connect();
        let databases = await connection.query("SHOW DATABASES");  
        await connection.end();   
        return databases;
    }
    catch (error){
        throw error;
    }
}

async function query(settings, query){
    try{
        let connection = await mysql.createConnection({
            host     : settings.host,
            port     : settings.port,
            user     : settings.user,
            password : settings.pw,
            database : settings.db
        });

        await connection.connect();
        let result = await connection.query(query);  
        await connection.end();   
        return result;
    }
    catch (error){
        throw error;
    }
}

exports.getDatabases = getDatabases;
exports.checkConnection = checkConnection;
exports.query = query;