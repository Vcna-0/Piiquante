//require('dotenv').config();  il sera bien de l'utiliser plus tard pour ne pas avoir à écrire en dur des choses comme le mot de passe mongoDb
const express = require('express');
const mongoose= require('mongoose');
const path = require('path');

const sauceRoutes = require('./routes/sauces');
const userRoutes = require('./routes/user');

const app = express();

//CONNEXION A MONGODB
mongoose.connect('mongodb+srv://piquante:ZEtZuIXqWM6DaQLS@piquante.joqv1wo.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

  
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); //Autorise l'accès à l'API pour n'importe quelle origine (sinon erreurs CORS)
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');  //Définit les Headers utilisé par l'API
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');  //Définition les méthodes possibles
    next();
});

app.use(express.json());    //body-parser présent dans express. Permet de lire le contenu JSON renvoyé par les requêtes POST


app.use('/api/sauces', sauceRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;