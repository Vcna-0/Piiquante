const modelSauce = require('../models/Sauce');
const jwt = require('jsonwebtoken');
const fs = require('fs'); // on a besoin du file system pour pouvoir supprimer une image

exports.getAllSauces = (req, res, next) => {
    console.log('Cherche sauce dans le contrôleur méthode getAllSauces'); 
   modelSauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error:"xxx"}));  
    console.log('Sauce récupérée dans le contrôleur méthode getAllSauces'); 
};

exports.getSauceById = (req, res, next) => {
    modelSauce.findOne({_id: req.params.id})
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));  
    console.log('Sauce particulière récupérée'); 
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
	// verifier que seul le créateur a le droit de modifier la sauce
    console.log('Sauce récupérée dans le contrôleur méthode modifySauce'); 
	const sauceObject = req.file ?
    {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body};
    console.log(JSON.stringify(sauceObject));
    modelSauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
    .then(() => res.status(200).json({message: 'Sauce modifiée'}))
    .catch(error => res.status(400).json({error}));  
    console.log('Sauce modifiée'); 
};

exports.deleteSauce = (req, res, next) => {
    console.log('Sauce récupérée dans le contrôleur méthode deleteSauce'); 
	// verifier que seul le créateur a le droit de supprimer la sauce
	modelSauce.findOne({_id: req.params.id})
    .then(sauce => {  // ne pas oublier de supprimer aussi l'image de la sauce
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


exports.likeOrDislike = (req, res, next) => {
    let action = req.body.like;
    let sauceId = req.params.id; // l'id la sauce 
    let currentUserId = req.body.userId; // celui qui fait l'action

    // console.log("action", action)
    // console.log("sauceId", sauceId);
    // console.log("currentUserId", currentUserId); 

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
                            .then(() => res.status(200).json({message: 'Sauce liké'}))
                            .catch(error => res.status(400).json({error}));  

                        // Vérifie si l'utilisateur n'a pas déja disliké la sauce
                        if (sauceLiked.usersDisliked.includes(currentUserId)){
                            modelSauce.updateOne(
                                {_id: sauceId}, 
                                { $pull: {usersDisliked: currentUserId}, $inc: {dislikes: -1} }
                            )
                            .then(() => res.status(200).json({message: 'Sauce disliké'}))
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
                            .then(() => res.status(200).json({message: 'Sauce disliké'}))
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
                        res.status(409).json({ message: 'Vous avez déja disliké cette sauce' });
                    }
                    break;
            }
            console.log("sauce", sauceLiked);
        }) 
}

// exports.likeSauce = (req, res, next) => { 

//     let currentUserId = req.body.userId
//     modelSauce.findOne({ _id: req.params.id })
//         .then((sauceLiked) => {
//             console.log("current", currentUserId);
//             console.log("sauceUserid", sauceLiked.userId);

//             if(!sauceLiked.usersLiked.includes(currentUserId)) {
//                 sauceLiked.usersLiked.push(currentUserId)
//                 sauceLiked.likes = sauceLiked.usersLiked.length - 1
//                 if(sauceLiked.usersDisliked.includes(currentUserId)){
//                     let position = sauceLiked.usersDisliked.indexOf(currentUserId)
//                     console.log(position);
//                     sauceLiked.usersDisliked.splice(position,1)
                    
//                 }
//                 console.log(JSON.stringify(sauceLiked));
//                 modelSauce.updateOne({_id: req.params.id}, {userLiked: sauceLiked.userLiked, likes: sauceLiked.likes})
//                 .then(() => res.status(200).json({message: 'Sauce liké'}))
//                 .catch(error => res.status(400).json({error}));  
//             }else{
//                 res.status(403).json({ message: "Vous avez déja liké cette sauce" });
//             }
//         })
// }            



//========================================================================================

// exports.likeSauce = (req, res, next) => { 
//     console.log("req", req.body);

//     let currentUserId = req.body.userId
//     modelSauce.findOne({ _id: req.params.id })
//         .then((sauceLiked) => {
//             console.log("current", currentUserId);
//             console.log("sauceUserid", sauceLiked.userId);

//             if (currentUserId != sauceLiked.userId) {
//                 if(!sauceLiked.usersLiked.includes(currentUserId)) {
//                     sauceLiked.usersLiked.push(currentUserId)
//                     sauceLiked.likes = sauceLiked.usersLiked.length - 1
//                     if(sauceLiked.usersDisliked.includes(currentUserId)){
//                         let position = sauceLiked.usersDisliked.indexOf(currentUserId)
//                         console.log(position);
//                         sauceLiked.usersDisliked.splice(position,1)
                        
//                     }
//                     console.log(JSON.stringify(sauceLiked));
//                     modelSauce.updateOne({_id: req.params.id}, {userLiked: sauceLiked.userLiked, likes: sauceLiked.likes})
//                     .then(() => res.status(200).json({message: 'Sauce modifiée'}))
//                     .catch(error => res.status(400).json({error}));  
//                     console.log('Sauce modifiée'); 
//                 }
//             }else{
//                 res.status(403).json({ message: "Vous ne pouvez pas liker votre propre sauce" });
//             }
