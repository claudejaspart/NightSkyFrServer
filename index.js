const express = require('express');
const app = express();
const path = require('path');
const { url } = require('inspector');
const { Pool, Client } = require('pg');
const bodyParser = require('body-parser');
const multer = require('multer');
const { fileURLToPath } = require('url');
const { sha512 } = require('js-sha512');
const { Console } = require('console');

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
app.use('/images', express.static('images'));

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

// ************************************************
//
//                    TELESCOPES
//
// ************************************************


// récupère la liste des telescopes
app.get('/telescopes', (req,response)=>
{
  getTelescopes = 'select * from telescopes;';
  client.query(getTelescopes, (err,res)=>
  {
    if (!err)
    {
      res.rows ? response.send(res.rows) : response.send("NOENTRY-DB-SELECT");
    }
    else
      response.send("FAIL-DB-SELECT");
  });  
});

/* Ajout d'un telescope */
app.post('/addTelescope', upload.any('image'),  (req, response) =>
{
  
  // récupération des données
  // telescope
  name = req.body.name;
  diameter = req.body.diameter;
  focalLength = req.body.focal;
  fdratio = req.body.fdratio;
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;

  // index des insertions
  telescopeIndex = 0;
  imageIndex = 0;

  // requete sql
  insertTelescope = `insert into telescopes values (DEFAULT, '${name}', '${diameter}', '${focalLength}', '${fdratio}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
  
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
            console.log(errIm);
            response.send('FAIL-IMAGE-DB-INS');
          }          
        });     
      });

      response.send('SUCCESS-DB-INS');
    }
    else
    {
      response.send('FAIL-DB-INS');
    }
    
  });
})


// supprime un telescope et ses images
app.delete('/delTelescopes/:id', (request,response)=>
{
  console.log(request.params.id);
  response.send("SUCCESS-DB-DELETE");
  
  // // récupérer la liste des url des images
  // let getImagesURL = `select path from images where id in (select image_id from telescope_has_images where telescope_id = 12);`
  // client.query(getImagesURL, (err,res)=>
  // {
  //   if (!err)
  //   {
  //     console.log(res.rows);
  //   }
  //   else
  //     response.send("FAIL-TELESCOPE-DB-DEL-SEL-IMAGES-URL");
  // });  


  // supprimer les images

  // supprimer les données
});





// ************************************************
//
//                    EYEPIECE
//
// ************************************************

// récupère la liste des oculaires
app.get('/eyepieces', (req,response)=>
{
  getEyepieces = 'select * from eyepieces;';
  client.query(getEyepieces, (err,res)=>
  {
    if (!err)
    {
      res.rows ? response.send(res.rows) : response.send("NOENTRY-DB-SELECT");
    }
    else
      response.send("FAIL-DB-SELECT");
  });  
});

/* Ajout d'un oculaire */
app.post('/addEyepiece', upload.any('image'),  (req, response) =>
{
  
  // récupération des données
  // eyepiece
  name = req.body.name;
  focalLength = req.body.focal;
  afov = req.body.afov;
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;

  // index des insertions
  eyepieceIndex = 0;
  imageIndex = 0;

  // requete sql
  insertEyepiece = `insert into eyepieces values (DEFAULT, '${name}', '${focalLength}', '${afov}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
  
  client.query(insertEyepiece, 
  (errTel, resTel) => 
  {
    if (!errTel)
    {
      // recuperation id telescope
      eyepieceIndex = resTel.rows[0].id;

      // Insertion des images
      req.files.forEach(currentFile => 
      {
        insertImages = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${name}', '', '${author}', CURRENT_TIMESTAMP, 1) RETURNING id;`;
        client.query(insertImages, (errIm, resIm) => 
        {
          if (!errIm)
          {
              // recuperation id telescope
              imageIndex = resIm.rows[0].id;              

              // insertion dans la table d'association
              addImageToEyepiece = `insert into eyepiece_has_images values (${eyepieceIndex}, ${imageIndex});`
              client.query(addImageToEyepiece, (errIm, resIm) => {});
          } 
          else
          {
            console.log(errIm);
            response.send('FAIL-IMAGE-DB-INS');
          }          
        });     
      });

      response.send('SUCCESS-DB-INS');
    }
    else
    {
      response.send('FAIL-DB-INS');
    }
  });
})




// ************************************************
//
//                    BINOCULARS
//
// ************************************************

// récupère la liste des jumelles
app.get('/binoculars', (req,response)=>
{
  getBinoculars = 'select * from binoculars;';
  client.query(getBinoculars, (err,res)=>
  {
    if (!err)
    {
      res.rows ? response.send(res.rows) : response.send("NOENTRY-DB-SELECT");
    }
    else
      response.send("FAIL-DB-SELECT");
  });  
});

/* Ajout de jumelles */
app.post('/addBinoculars', upload.any('image'),  (req, response) =>
{
  // récupération des données
  // Binoculars
  name = req.body.name;
  diameter = req.body.diameter;
  magnification = req.body.magnification;
  afov = req.body.afov
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;

  // index des insertions
  BinocularsIndex = 0;
  imageIndex = 0;

  // requete sql
  insertBinoculars = `insert into Binoculars values (DEFAULT, '${name}', '${diameter}', '${magnification}', '${afov}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
  console.log(insertBinoculars);

  client.query(insertBinoculars, 
  (errTel, resTel) => 
  {
    if (!errTel)
    {
      // recuperation id telescope
      binocularsIndex = resTel.rows[0].id;

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
              addImageToBinoculars = `insert into binoculars_has_images values (${binocularsIndex}, ${imageIndex});`
              client.query(addImageToBinoculars, (errIm, resIm) => {});
          } 
          else
          {
            console.log(errIm);
            response.send('FAIL-IMAGE-DB-INS');
          }          
        });     
      });

      response.send('SUCCESS-DB-INS');
    }
    else
    {
      response.send('FAIL-DB-INS');
    }
  });
})


// ************************************************
//
//             RECUPERATION DES IMAGES
//
// ************************************************

app.get('/EquipmentImages', (request,response)=>
{
  // récupération type equipement et de son id
  let itemId = request.query.id;
  let itemType = request.query.type;
  let absoluteStaticPath = "http:\\\\78.218.242.131:4201\\";
  
  // récupération de la bonne requete
  let getImagesQuery = `select id, '${absoluteStaticPath}' || path as path, title, description, author from images where id in (select image_id from ${itemType}_has_images where ${itemType}_id=${itemId});`;

  // execution de la requete
  client.query(getImagesQuery, (err,res)=>
  {
    if (!err)
    {
      res.rows ? response.send(res.rows) : response.send("NOENTRY-DB-SELECT");
    }
    else
      response.send("FAIL-DB-SELECT");
  });  
  
});