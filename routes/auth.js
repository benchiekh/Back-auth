const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware'); // Le middleware pour vérifier le JWT

const User = require('../models/User');
const Product = require('../models/Product');

const router = express.Router();


router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;
    console.log('Incoming request body:', req.body);  // Ajoutez un log ici
  
    try {
      let user = await User.findOne({ email });
      console.log('User found:', user);  // Log pour vérifier la requête à la base de données
  
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }
  
      user = new User({ firstName, lastName, email, password, role });
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();
      console.log('User saved:', user);  // Log pour vérifier que l'utilisateur est bien enregistré
  
      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token });
    } catch (err) {
      console.error(err.message);  // Log l'erreur réelle
      res.status(500).json({ error: 'Server error' });
    }
  });
    
  
/////// route login 
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // Utilisez 'email' au lieu de 'username'
  
    try {
        // Trouver l'utilisateur par email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
  
        // Vérifier si le mot de passe correspond
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
  
        console.log('User object:', user); // Voir si le rôle est présent dans l'objet utilisateur
  
        // Créer le payload avec userId et le rôle de l'utilisateur
        const payload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
        // Envoyer le jeton et le rôle de l'utilisateur dans la réponse
        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
/// connected 
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password'); // Exclure le mot de passe des données renvoyées
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching authenticated user:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


//// liste user 
router.get('/users', async (req, res) => {
    try {
      const users = await User.find({ role: 'user' }); // Filtrer les utilisateurs avec le rôle 'user'
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
   

  //// delete user 
  router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// Assurez-vous que la route est définie avec le verbe PUT
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, role } = req.body;
  
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { firstName, lastName, email, role },
        { new: true, runValidators: true }
      );
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
    
  // ajouter prosuits
  router.post('/products', async (req, res) => {
    const { name, description, price, quantity} = req.body;

    console.log('Données reçues :', req.body);

    try {
        const newProduct = new Product({ name, description, price, quantity});
        console.log('Nouveau produit créé :', newProduct);

        const savedProduct = await newProduct.save();
        console.log('Produit sauvegardé :', savedProduct);

        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du produit :', error);
        res.status(400).json({ message: 'Erreur lors de la création du produit', error });
    }
});




// Récupérer tous les produits
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find(); // Assurez-vous que le modèle `Product` est correct
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


  

// Modifier un produit par son ID
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity} = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, description, price, quantity},
      { new: true, runValidators: true } // Retourner le produit mis à jour
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour du produit', error });
  }
});


// Supprimer un produit par son ID
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id); // Supprimer le produit par ID
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du produit', error });
  }
});
router.put('/user', authMiddleware, async (req, res) => {
  console.log('PUT /user route reached'); 
  const { firstName, lastName, email, role } = req.body;
  try {

      const user = await User.findByIdAndUpdate(
          req.user.userId,
          { firstName, lastName, email, role },
          { new: true, runValidators: true }
      );
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.status(200).json({ message: 'Utilisateur mis à jour avec succès', user });
  } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error });
  }
});


// Route pour récupérer les statistiques des produits
router.get('/products/stats', async (req, res) => {
  try {
    // Compte total des produits dans la base de données
    const totalProducts = await Product.countDocuments();

    // Trouve le produit le plus cher en triant par prix décroissant
    const mostExpensiveProduct = await Product.findOne().sort('-price').exec();

    // Renvoie les statistiques sous forme de JSON
    res.json({
      totalProducts,
      mostExpensiveProduct: {
        name: mostExpensiveProduct.name,
        price: mostExpensiveProduct.price
      }
    });
  } catch (error) {
    // En cas d'erreur, renvoie une réponse d'erreur
    console.error('Erreur lors de la récupération des statistiques des produits', error);
    res.status(500).json({ msg: 'Server error' });
  }
});



  module.exports = router;
  