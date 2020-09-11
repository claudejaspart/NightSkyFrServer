const express = require('express');
const app = express();
const path = require('path');
const { url } = require('inspector');
const { Pool, Client } = require('pg');
const bodyParser = require('body-parser');
const multer = require('multer');
const { fileURLToPath } = require('url');
const { sha512 } = require('js-sha512');

const storage = multer.diskStorage(
  {
    destination: function (req, file, cb) 
    {
      cb(null, './Images/')
    },
    filename: function (req, file, cb) 
    {
      cb(null, sha512(file.originalname) +  path.extname(file.originalname))
    }
});
const upload=multer({storage:storage});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, '../../002 Frontend/001 NightSky Frontend/NightSkyFr/dist/NightSkyFr/')));

// client postgres
var data = ""
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'NightSkyFrDB',
  password: 'emfadmin',
  port: 5432,
});
client.connect();


// angular frontend
app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

// lancement du serveur
app.listen(4201, function () {console.log('Example app listening on port 4201!')});

// API EQUIPEMENTS
// ***************


/* Ajout d'un telescope */
app.post('/addTelescope', upload.any('image'),  (req, response) =>
{
  // récupération des données
  // telescope
  name = req.body.name;
  aperture = req.body.aperture;
  focalLength = req.body.focal;
  fdratio = req.body.fdratio;
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;
  
  // index des insertions
  telescopeIndex = 0;
  imageIndex = 0;

  // requete sql
  insertTelescope = `insert into telescopes values (DEFAULT, '${name}', '${aperture}', '${focalLength}', '${fdratio}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
   
  client.query(insertTelescope, 
  (errTel, resTel) => 
  {
    if (!errTel)
    {
      // recuperation id telescope
      telescopeIndex = resTel.rows[0].id;

      // Insertion des images
      req.files.forEach(currentFile => 
      {
         insertImages = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${name}', '', '${author}', CURRENT_TIMESTAMP, 1) RETURNING id;`;
         
        // execution de la requete
        client.query(insertImages, (errIm, resIm) => 
        {
          if (!errIm)
          {
              // recuperation id telescope
              imageIndex = resIm.rows[0].id;              

              // insertion dans la table d'association
              addImageToTelescope = `insert into telescope_has_images values (${telescopeIndex}, ${imageIndex});`
              client.query(addImageToTelescope, (errIm, resIm) => {});
          } 
          else
          {
            response.send('FAIL-IMAGE-DB-INS');
          }          
        });     
      });

      response.send('SUCCESS-TELESCOPE-DB-INS');
    }
    else
    {
      response.send('FAIL-TELESCOPE-DB-INS');
    }
    
  });
})

app.get('/telescopes', (req,response)=>
{
  
  getTelescopes = 'select * from telescopes';
  client.query(getTelescopes, (err,res)=>
  {
    if (!err)
    {
      res.rows ? response.send(res.rows) : response.send("DBNODATA");
    }
    else
      response.send("DBNOK");
  });  
});






