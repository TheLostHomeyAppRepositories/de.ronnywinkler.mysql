
'use strict';
const  mysql = require('mysql2/promise');

async function checkConnection(settings){
    let connection;
    try{
        connection = await mysql.createConnection({
            host     : settings.host,
            port     : settings.port,
            user     : settings.user,
            password : settings.pw
        });

        await connection.connect();
        await connection.ping();     
    }
    catch (error){
        throw error;
    }
    finally {
      if (connection != undefined){ 
        await connection.end();
      }
    }
    return true;
  }

async function getDatabases(settings){
    let connection;
    try{
        connection = await mysql.createConnection({
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
    finally {
      if (connection != undefined){ 
        await connection.end();
      }
    }
}

async function query(settings, query){
    let connection;
    let result;
    try{
        connection = await mysql.createConnection({
            host     : settings.host,
            port     : settings.port,
            user     : settings.user,
            password : settings.pw,
            database : settings.db
        });

        await connection.connect();
        result = await connection.query(query);  
    }
    catch (error){
        throw error;
    }
    finally {
      if (connection != undefined){ 
        await connection.end();
      }
    }
    return result;
}

exports.getDatabases = getDatabases;
exports.checkConnection = checkConnection;
exports.query = query;