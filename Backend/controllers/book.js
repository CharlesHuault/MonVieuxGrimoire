const book = require('../models/book');
const Book = require('../models/book')
const fs = require('fs')


// Créer un livre
exports.createBook = (req, res, next) => {
   const bookObject = JSON.parse(req.body.book);
   delete bookObject._id;
   delete bookObject._userId;
   const book = new Book({
       ...bookObject,
       userId: req.auth.userId,
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  book.save()
    .then(() => res.status(201).json({ message: 'Livre enregistré !'}))
    .catch((error) => res.status(400).json({ error: error }));
}

// Récupérer un livre spécifique
exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error: error }));
}

// Modifier un livre
exports.modifyBook = (req, res, next) => {
   const bookObject = req.file ? {
       ...JSON.parse(req.body.book),
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
 
   delete bookObject._userId;
   Book.findOne({_id: req.params.id})
       .then((book) => {
           if (book.userId != req.auth.userId) {
               res.status(401).json({ message : 'Not authorized'});
           } else {
               Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
               .then(() => res.status(200).json({message : 'Objet modifié!'}))
               .catch(error => res.status(401).json({ error }));
           }
       })
       .catch((error) => {
           res.status(400).json({ error });
       });
}

// Supprimer un livre
exports.deleteBook = (req, res, next) => {
   Book.findOne({ _id: req.params.id})
       .then(book => {
           if (book.userId != req.auth.userId) {
               res.status(401).json({message: 'Not authorized'});
           } else {
               const filename = book.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Book.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                       .catch(error => res.status(401).json({ error }));
               });
           }
       })
       .catch( error => {
           res.status(500).json({ error });
       });
}

// Récupérer tous les livres
exports.getAllBooks = (req, res, next) => {
        Book.find()
        .then(book => res.status(200).json(book))
        .catch((error) => res.status(400).json({ error: error }));
}

// Afficher les 3 livres les mieux notés
exports.getTopRatedBooks = async (req, res, next) => {
    try {
        const books = await Book.find().sort({ averageRating: -1 }).limit(3);
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ error });
    }
};

// Notation d'un livre par l'utilisateur
exports.rateBook = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const rating = req.body.rating;
        const book = await Book.findOne({ _id: req.params.id });

        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }
        const userRatingIndex = book.ratings.findIndex(rating => rating.userId === userId); // On vérifie si le user n'a pas déja noté le livre
        if (userRatingIndex !== -1) { // Il a déjà noté donc on met sa note à jour        
            book.ratings[userRatingIndex].grade = rating;
        } else { // Il n'a pas noté donc on crée sa note         
            book.ratings.push({ userId, grade: rating });
        }

        // Calcul de la nouvelle note moyenne
        const totalRatings = book.ratings.length;
        const totalGrade = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
        const averageRating = totalGrade / totalRatings;

        book.averageRating = averageRating;
        // Sauvegarde du livre avec sa note moyenne mise à jour
        await book.save();

        res.status(200).json({ message: 'Note enregistrée !' });
    } catch (error) {
        res.status(500).json({ error });
    }
};