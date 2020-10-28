const express = require('express');
const app = express();
const path = require('path');


// liste des API equipements
const telescopeRouter  = require('./Equipment/telescope');
const eyepieceRouter  = require('./Equipment/eyepiece');
const binocularsRouter  = require('./Equipment/binoculars');
const equipmentRouter  = require('./Equipment/equipment-item');

app.use(telescopeRouter);
app.use(eyepieceRouter);
app.use(binocularsRouter);
app.use(equipmentRouter);

// liste des API sites
const newSiteRouter  = require('./Sites/new-site');
const listSitesRouter = require('./Sites/list-site');
const deleteSiteRouter  = require('./Sites/delete-site');
const editSiteRouter  = require('./Sites/edit-site');
app.use(newSiteRouter);
app.use(listSitesRouter);
app.use(deleteSiteRouter);
app.use(editSiteRouter);

// liste des API observation lists
const obsListsRouter  = require('./ObservationLists/observationLists');
app.use(obsListsRouter);
const newObservationListRouter  = require('./ObservationLists/new-observationLists');
app.use(newObservationListRouter);


app.use(express.static(path.join(__dirname, '../../002 Frontend/001 NightSky Frontend/NightSkyFr/dist/NightSkyFr/')));
app.use('/images', express.static('images'));


// angular frontend
app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

// lancement du serveur
app.listen(4201, function () {console.log('Night-Sky.fr listening on port 4201!')});

