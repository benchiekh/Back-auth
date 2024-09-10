const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
    
  
  // Route pour créer un produit
  router.post('/products', async (req, res) => {
    const { name, description, price, quantity, category } = req.body;
  
    try {
      const newProduct = new Product({ name, description, price, quantity, category });
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(400).json({ message: 'Erreur lors de la création du produit', error });
    }
  });


// Récupérer tous les produits
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find(); // Récupérer tous les produits
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des produits', error });
  }
});

  

// Modifier un produit par son ID
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, quantity, category } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, description, price, quantity, category },
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

  
  module.exports = router;
  