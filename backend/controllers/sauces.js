const modelSauce = require('../models/Sauce');
const fs = require('fs');


// Affiche toutes les sauces
exports.getAllSauces = (req, res, next) => {
   modelSauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({
        error: error,
        message :"Impossible de récupérer les sauces de la base de données"
    }));  
};


// Affiche une sauce selon son ID
exports.getSauceById = (req, res, next) => {
    modelSauce.findOne({_id: req.params.id})
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({
        error: error, 
        message: "Impossible de récupérer la sauce avec cet identifiant"
    }));  
};


// Ajout d'une sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    delete sauceObject._userId
    const sauce = new modelSauce({
        ...sauceObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });

    sauce.save()
    .then(() => res.status(201).json({message: "Sauce ajoutée"}))
    .catch(error => res.status(400).json({ error }));
};


// Modifier une sauce
exports.modifySauce = (req, res ,next) => {
	const sauceObject = req.file ?{
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body};

    modelSauce.findOne({_id: req.params.id})
        .then((sauceToModify) => {
            if (sauceToModify.userId != req.auth.userId) {
                res.status(403).json({ message : "Vous n'avez pas le droit de modifier cette sauce"});
            } 
            else {
                modelSauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée'}))
                .catch(error => res.status(500).json({error}));
            }
        })
        .catch((error) => {
          res.status(500).json({error});
        });
};


// Supprime une sauce
exports.deleteSauce = (req, res, next) => {
	modelSauce.findOne({_id: req.params.id})
    .then((sauceToDelete) => {
        if (sauceToDelete.userId != req.auth.userId) {
            res.status(403).json({message : "Vous n'avez pas le droit de supprimer cette sauce"});
        } 
        else {
            const filename = sauceToDelete.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                modelSauce.deleteOne({_id: req.params.id})
                .then(() => res.status(200).json({message: 'Sauce supprimée'}))
                .catch(error => res.status(400).json({ error }));  
                console.log('Sauce supprimée'); 
            });
        }
    })
    .catch(error => res.status(500).json({ error }));
};


// Like et dislike de la sauce
exports.likeOrDislike = (req, res, next) => {
    let action = req.body.like;
    let sauceId = req.params.id;
    let currentUserId = req.auth.userId;

    modelSauce.findOne({ _id: sauceId })
        .then((sauceLiked) => {
            switch (action) {
                case 1:
                    if (!sauceLiked.usersLiked.includes(currentUserId)) {
                        modelSauce.updateOne(
                            {_id: sauceId}, 
                            { $push: {usersLiked: currentUserId}, $inc: {likes: +1} }
                        )
                            .then(() => res.status(200).json({message: 'Sauce likée'}))
                            .catch(error => res.status(400).json({ error }));  

                        if (sauceLiked.usersDisliked.includes(currentUserId)){
                            modelSauce.updateOne(
                                {_id: sauceId}, 
                                { $pull: {usersDisliked: currentUserId}, $inc: {dislikes: -1} }
                            )
                            .then(() => res.status(200).json({message: 'Sauce dislikée'}))
                            .catch(error => res.status(400).json({ error }));  
                        }
                    }
                    else{
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
                            .catch(error => res.status(400).json({ error }));  
                    }
                    if(sauceLiked.usersDisliked.includes(currentUserId)){
                        modelSauce.updateOne(
                            { _id: sauceId }, 
                            { $pull: {usersDisliked: currentUserId}, $inc: {dislikes: -1} }
                        )
                            .then(() => res.status(200).json({message: 'Dislike retiré'}))
                            .catch(error => res.status(400).json({ error }));  
                    }
                    break;
                
                case -1:
                    if (!sauceLiked.usersDisliked.includes(currentUserId)) {
                        modelSauce.updateOne(
                            {_id: sauceId}, 
                            { $push: {usersDisliked: currentUserId}, $inc: {dislikes: +1} }
                        )
                            .then(() => res.status(200).json({message: 'Sauce dislikée'}))
                            .catch(error => res.status(400).json({ error }));  

                        if (sauceLiked.usersLiked.includes(currentUserId)){
                            modelSauce.updateOne(
                                { _id: sauceId }, 
                                {  $pull: {usersLiked: currentUserId}, $inc: {likes: -1} }
                            )
                            .then(() => res.status(200).json({ message: 'Like retiré' }))
                            .catch(error => res.status(400).json({ error }));  
                        }
                    }
                    else{
                        res.status(409).json({ message: 'Vous avez déja dislikée cette sauce' });
                    }
                    break;
            }
        }) 
}