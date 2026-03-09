const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-demo-key-change-me';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [
        {
          id: uuidv4(),
          name: 'Demo Plumber',
          email: 'plumber@example.com',
          password: bcrypt.hashSync('password123', 10),
          role: 'artisan',
          phone: '08030000001',
          location: 'Lagos',
          skill: 'Plumber',
          description: 'Fast and reliable plumbing services for homes and offices.',
          yearsExperience: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          name: 'Demo Electrician',
          email: 'electrician@example.com',
          password: bcrypt.hashSync('password123', 10),
          role: 'artisan',
          phone: '08030000002',
          location: 'Abuja',
          skill: 'Electrician',
          description: 'Electrical wiring, repairs, and installations.',
          yearsExperience: 7,
          createdAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, skill, description, yearsExperience } = req.body;

    if (!name || !email || !password || !role || !phone || !location) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const db = readDb();
    const existingUser = db.users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      location,
      skill: role === 'artisan' ? (skill || '') : '',
      description: role === 'artisan' ? (description || '') : '',
      yearsExperience: role === 'artisan' ? Number(yearsExperience || 0) : 0,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        location: newUser.location,
        skill: newUser.skill,
        description: newUser.description,
        yearsExperience: newUser.yearsExperience
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = readDb();
    const user = db.users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        skill: user.skill,
        description: user.description,
        yearsExperience: user.yearsExperience
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/artisans', (req, res) => {
  const { skill = '', location = '', search = '' } = req.query;
  const db = readDb();

  let artisans = db.users.filter(user => user.role === 'artisan');

  if (skill) {
    artisans = artisans.filter(artisan => artisan.skill.toLowerCase().includes(skill.toLowerCase()));
  }

  if (location) {
    artisans = artisans.filter(artisan => artisan.location.toLowerCase().includes(location.toLowerCase()));
  }

  if (search) {
    artisans = artisans.filter(artisan => {
      const searchable = `${artisan.name} ${artisan.skill} ${artisan.location} ${artisan.description}`.toLowerCase();
      return searchable.includes(search.toLowerCase());
    });
  }

  const sanitized = artisans.map(({ password, ...rest }) => rest);
  res.json(sanitized);
});

app.get('/api/me', authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find(user => user.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password, ...sanitized } = user;
  res.json(sanitized);
});

app.put('/api/me', authMiddleware, (req, res) => {
  const db = readDb();
  const index = db.users.findIndex(user => user.id === req.user.id);
  if (index === -1) return res.status(404).json({ message: 'User not found' });

  const current = db.users[index];
  const updatedUser = {
    ...current,
    name: req.body.name ?? current.name,
    phone: req.body.phone ?? current.phone,
    location: req.body.location ?? current.location,
    skill: req.body.skill ?? current.skill,
    description: req.body.description ?? current.description,
    yearsExperience: req.body.yearsExperience ?? current.yearsExperience
  };

  db.users[index] = updatedUser;
  writeDb(db);

  const { password, ...sanitized } = updatedUser;
  res.json({ message: 'Profile updated', user: sanitized });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDb();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
