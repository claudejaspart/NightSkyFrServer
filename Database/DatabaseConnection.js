const { Client } = require('pg');

// executeur de requete 
const dbQuery = (this_query) => 
{
    let client = new Client(
    {
        user: 'postgres',
        host: 'localhost',
        database: 'NIGHTSKYFR',
        password: 'emfadmin',
        port: 5432,
    });

    var dbPromise = client
        .connect()
        .then(  () => 
        { 
            dbQueryPromise = client.query(this_query)
                  .then(result=>{return new Promise( (resolve, reject)=>
                    {
                        resolve(result.rows)

                    })})
                  .catch(err => {return new Promise( (resolve, reject)=>{reject("DB_QUERY_FAIL")} )})

            return dbQueryPromise;
                  
        })
        .catch( err => {return new Promise( (resolve, reject)=>{reject("DB_CONNECTION_FAIL")} )})

    return dbPromise;
}


module.exports = 
{
    dbQuery
};

