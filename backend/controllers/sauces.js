const modelSauce = require('../models/Sauce');
const jwt = require('jsonwebtoken');
const fs = require('fs');
// require('dotenv').config();

exports.getAllSauces = (req, res, next) => {
   modelSauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({
        error: error,
        message :"Impossible de récupérer les sauces de la base de données"
    }));  
};

exports.getSauceById = (req, res, next) => {
    modelSauce.findOne({_id: req.params.id})
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({
        error: error, 
        message: "Impossible de récupérer la sauce avec l'identifiant '" + req.params.id
    }));  
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new modelSauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes:0,
        usersLiked: [""],
        usersDisliked: [""]
    });
    sauce.save()
    .then(() => res.status(201).json({message: "Sauce ajoutée"}))
    .catch(error => res.status(400).json({error}));
    console.log('Sauce initialisée');
};

exports.modifySauce = (req, res ,next) => {
	const sauceObject = req.file ?{
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body};

    modelSauce.findOne({_id: req.params.id})
        .then((sauceToModify) => {
            if (sauceToModify.userId != req.body.userId) {
                res.status(403).json({ message : "Vous n'avez pas le droit de modifier cette sauce"});
            } else {
                modelSauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée'}))
                .catch(error => res.status(500).json({error}));
            }
        })
        .catch((error) => {
          res.status(500).json({error});
        });
};

exports.deleteSauce = (req, res, next) => { 

	modelSauce.findOne({_id: req.params.id})
    .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
            modelSauce.deleteOne({_id: req.params.id})
            .then(() => res.status(200).json({message: 'Sauce supprimée'}))
            .catch(error => res.status(400).json({error}));  
            console.log('Sauce supprimée'); 
        });
    })
    .catch(error => res.status(500).json({error}));
};

// exports.deleteSauce = (req, res, next) => {

//     const token = req.headers.authorization.split(' ')[1];
//     const decodedToken = jwt.verify(token, process.env.RANDOM_TOKEN_SECRET);
//     const userId = decodedToken.userId;
//     console.log("UseridToken :", userId);

// 	modelSauce.findOne({_id: req.params.id})
//     .then((sauceToDelete) => {

//         console.log("UseridSauce :", sauceToDelete.userId );
//         console.log("CurrentUserid :", req.body.userId);
        
//         if (sauceToDelete.userId != userId) {
//             res.status(403).json({message : "Vous n'avez pas le droit de supprimer cette sauce"});
//         } else {
//             const filename = sauce.imageUrl.split('/images/')[1];
//             fs.unlink(`images/${filename}`, () => {
//                 modelSauce.deleteOne({_id: req.params.id})
//                 .then(() => res.status(200).json({message: 'Sauce supprimée'}))
//                 .catch(error => res.status(400).json({error}));  
//                 console.log('Sauce supprimée'); 
//             });
//         }
//     })
//     .catch(error => res.status(500).json({error}));
// };


exports.likeOrDislike = (req, res, next) => {
    let action = req.body.like;
    let sauceId = req.params.id;
    let currentUserId = req.body.userId;

    modelSauce.findOne({ _id: sauceId })
        .then((sauceLiked) => {
            switch (action) {
                case 1:
                    // Vérifie si l'utilisateur n'a pas déja liké la sauce
                    if (!sauceLiked.usersLiked.includes(currentUserId)) {
                        modelSauce.updateOne(
                            {_id: sauceId}, 
                            { $push: {usersLiked: currentUserId}, $inc: {likes: +1} }
                        )
                            .then(() => res.status(200).json({message: 'Sauce likée'}))
                            .catch(error => res.status(400).json({error}));  

                        // Vérifie si l'utilisateur n'a pas déja disliké la sauce
                        if (sauceLiked.usersDisliked.includes(currentUserId)){
                            modelSauce.updateOne(
                                {_id: sauceId}, 
                                { $pull: {usersDisliked: currentUserId}, $inc: {dislikes: -1} }
                            )
                            .then(() => res.status(200).json({message: 'Sauce dislikée'}))
                            .catch(error => res.status(400).json({error}));  
                        }
                    }else{
                        res.status(409).json({ message: 'Vous avez déja liké cette sauce' });
                    }
                    break;

                case 0:
                    if(sauceLiked.usersLiked.includes(currentUserId)){
                        modelSauce.updateOne(
                            {_id: sauceId}, 
                            { $pull: {usersLiked: currentUserId}, $inc: {likes: -1} }
                        )
                            .then(() => res.status(200).json({message: 'Like retiré'}))
                            .catch(error => res.status(400).json({error}));  
                    }
                    if(sauceLiked.usersDisliked.includes(currentUserId)){
                        modelSauce.updateOne(
                            {_id: sauceId}, 
                            { $pull: {usersDisliked: currentUserId}, $inc: {dislikes: -1} }
                        )
                            .then(() => res.status(200).json({message: 'Dislike retiré'}))
                            .catch(error => res.status(400).json({error}));  
                    }
                    break;
                
                case -1:
                    // Vérifie si l'utilisateur n'a pas déja disliké la sauce
                    if (!sauceLiked.usersDisliked.includes(currentUserId)) {
                        modelSauce.updateOne(
                            {_id: sauceId}, 
                            { $push: {usersDisliked: currentUserId}, $inc: {dislikes: +1} }
                        )
                            .then(() => res.status(200).json({message: 'Sauce dislikée'}))
                            .catch(error => res.status(400).json({error}));  

                        // Vérifie si l'utilisateur n'a pas déja liké la sauce
                        if (sauceLiked.usersLiked.includes(currentUserId)){
                            modelSauce.updateOne(
                                {_id: sauceId}, 
                                { $pull: {usersLiked: currentUserId}, $inc: {likes: -1} }
                            )
                            .then(() => res.status(200).json({message: 'Like retiré'}))
                            .catch(error => res.status(400).json({error}));  
                        }
                    }else{
                        res.status(409).json({ message: 'Vous avez déja dislikée cette sauce' });
                    }
                    break;
            }
            console.log("sauce", sauceLiked);
        }) 
}