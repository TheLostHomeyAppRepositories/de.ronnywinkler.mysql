
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
    let databases;
    try{
        connection = await mysql.createConnection({
            host     : settings.host,
            port     : settings.port,
            user     : settings.user,
            password : settings.pw
        });

        await connection.connect();
        databases = await connection.query("SHOW DATABASES");  
    }
    catch (error){
        throw error;
    }
    finally {
      if (connection != undefined){ 
        await connection.end();
        connection.destroy();
        connection = null; 
      }
    }
    return databases;
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
        connection.destroy();
        connection = null; 
      }
    }
    return result;
}

exports.getDatabases = getDatabases;
exports.checkConnection = checkConnection;
exports.query = query;