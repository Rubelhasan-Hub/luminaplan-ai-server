import { Router, Response } from 'express';
import Itinerary from '../models/Itinerary';
import { isFallback, getFallbackDb, saveFallbackDb } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const SEED_ITINERARIES = [
  {
    title: "Alpine Ascent: Swiss Peak Expedition",
    description: "An exhilarating trekking journey through the majestic summits of Zermatt, Swiss Alps.",
    fullDescription: "Experience the ultimate mountain adventure. Hike around the iconic Matterhorn, traverse suspension bridges, and sleep in cozy mountain huts. Designed for thrill-seekers and intermediate climbers seeking breathtaking panoramas and Swiss alpine hospitality.",
    price: 1890,
    duration: 7,
    category: "Adventure",
    location: "Zermatt, Switzerland",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
    ],
    createdBy: "admin-seed",
    createdAt: new Date(),
    specifications: {
      groupSize: 8,
      difficulty: "Hard",
      includes: ["Professional mountain guide", "All accommodation (mountain huts/hotels)", "Breakfast and dinners", "Safety gear and local passes"],
      excludes: ["International flights", "Climbing insurance", "Lunch snacks", "Tipping for guides"]
    },
    agenda: [
      { day: 1, title: "Arrival in Zermatt & Safety Briefing", activities: ["Meet your guide at the station", "Equipment check", "Welcome dinner with view of the Matterhorn"] },
      { day: 2, title: "Trek to Gornergrat", activities: ["Hike up to Riffelalp", "Marvel at the glacier views", "Stay at Gornergrat Kulm Hotel"] },
      { day: 3, title: "Matterhorn Glacier Trail", activities: ["Cross the rock glacier moraine", "Navigate mountain lakes", "Descent to Schwarzsee hut"] }
    ],
    reviews: [
      { userName: "Alex M.", rating: 5, comment: "Absolutely life-changing! The guides were top-notch and the views were surreal.", date: new Date() },
      { userName: "Clara S.", rating: 4, comment: "Challenging trails, but the views made every step worth it.", date: new Date() }
    ]
  },
  {
    title: "Kyoto Zen: Cultural Heritage Walk",
    description: "Immerse yourself in traditional tea ceremonies, historic temples, and bamboo groves.",
    fullDescription: "Trace the historic pathways of Kyoto. From the thousands of vermilion torii gates at Fushimi Inari Shrine to the serene moss gardens of ancient temples, this itinerary focuses on mindfulness, local gastronomy, and rich historical heritage.",
    price: 1450,
    duration: 5,
    category: "Cultural",
    location: "Kyoto, Japan",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80"
    ],
    createdBy: "admin-seed",
    createdAt: new Date(),
    specifications: {
      groupSize: 12,
      difficulty: "Easy",
      includes: ["Authentic ryokan stay", "Tea ceremony demonstration", "Fushimi Inari guided night tour", "Private local transit cards"],
      excludes: ["Airfare", "Personal souvenir spending", "Guide gratuities"]
    },
    agenda: [
      { day: 1, title: "Ryokan Welcome & Kaiseki Dinner", activities: ["Check-in to a 100-year-old Ryokan", "Traditional multi-course dinner", "Relax in the hot spring onsen"] },
      { day: 2, title: "Gion District & Temple Tours", activities: ["Morning tour of Kiyomizu-dera", "Wander through the wooden houses of Gion", "Spot local Geishas"] },
      { day: 3, title: "Arashiyama Bamboo Forest & Tea Ritual", activities: ["Early morning walk through bamboo path", "Participate in a private zen tea ceremony", "Visit the Tenryu-ji Temple garden"] }
    ],
    reviews: [
      { userName: "Kenji T.", rating: 5, comment: "Beautifully structured. The ryokan experience was the highlight of our entire trip to Japan.", date: new Date() }
    ]
  },
  {
    title: "Amalfi Coastline Dream",
    description: "Indulge in lemon groves, stunning cliffside villages, and azure Mediterranean waters.",
    fullDescription: "Relax in paradise. Explore Positano, Amalfi, and Ravello, charter a boat to the Island of Capri, and learn to make handmade pasta in a terraced lemon garden overlooking the ocean. The perfect balance of luxury and Italian charm.",
    price: 2200,
    duration: 6,
    category: "Relax",
    location: "Amalfi, Italy",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80"
    ],
    createdBy: "admin-seed",
    createdAt: new Date(),
    specifications: {
      groupSize: 10,
      difficulty: "Easy",
      includes: ["Coastal hotel with sea-view balcony", "Private boat tour to Capri and Blue Grotto", "Cooking class in a Ravello vineyard", "Airport transfers"],
      excludes: ["Lunches", "Optional excursions", "Flight tickets"]
    },
    agenda: [
      { day: 1, title: "Arrival in Sorrento & Sunset Dinner", activities: ["Airport meet and greet", "Check-in to hotel", "Welcome limoncello toast and dinner"] },
      { day: 2, title: "Cruising the Amalfi Coastline", activities: ["Ferry ride along Positano cliffs", "Shopping in Positano boutiques", "Sunbathing on the black sand beach"] },
      { day: 3, title: "Ravello Cliffside & Cooking School", activities: ["Visit Villa Cimbrone gardens", "Hands-on pasta and tiramisu class", "Wine tasting of local Aglianico"] }
    ],
    reviews: [
      { userName: "Sophia L.", rating: 5, comment: "It felt like a dream. POSITANO IS BEAUTIFUL!", date: new Date() }
    ]
  },
  {
    title: "Safari Odyssey: Serengeti Wildlife",
    description: "An authentic off-grid safari camp experience in the heart of Africa's wilderness.",
    fullDescription: "Witness the Great Migration. Embark on custom 4x4 game drives across the endless plains of the Serengeti, view lions, elephants, and leopards, and dine under the stars in a luxury tented eco-lodge.",
    price: 3100,
    duration: 8,
    category: "Adventure",
    location: "Serengeti, Tanzania",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=800&q=80"
    ],
    createdBy: "admin-seed",
    createdAt: new Date(),
    specifications: {
      groupSize: 6,
      difficulty: "Medium",
      includes: ["Luxury eco-camp lodging", "All park entry fees", "All meals & drinks", "Custom open-sided 4x4 vehicles & local trackers"],
      excludes: ["Visas", "Tips for trackers and safari crew", "International travel"]
    },
    agenda: [
      { day: 1, title: "Bush Plane to Seronera", activities: ["Scenic flight over Ngorongoro Crater", "Check-in to the luxury camp", "Sunset game drive"] },
      { day: 2, title: "The Great Migration Crossing", activities: ["Full-day tracking the wildebeest herds", "Picnic lunch under an acacia tree", "Campfire stories and dinner"] }
    ],
    reviews: [
      { userName: "Marcus D.", rating: 5, comment: "Seeing a leopard hunt up close was incredible. Highly recommend this exact tour.", date: new Date() }
    ]
  }
];

// Helper to seed database if empty
const seedIfEmpty = async () => {
  if (isFallback()) {
    const db = getFallbackDb();
    if (db.itineraries.length === 0) {
      db.itineraries = SEED_ITINERARIES.map((item, idx) => ({
        ...item,
        id: `itinerary-seed-${idx + 1}`
      }));
      saveFallbackDb(db);
      console.log('🌱 Fallback database pre-seeded.');
    }
  } else {
    try {
      const count = await Itinerary.countDocuments();
      if (count === 0) {
        await Itinerary.insertMany(SEED_ITINERARIES);
        console.log('🌱 MongoDB database pre-seeded.');
      }
    } catch (err) {
      console.error('Error pre-seeding MongoDB:', err);
    }
  }
};

// Seed automatically on load
seedIfEmpty();

// Get all itineraries (explore page with filter, search, sort, pagination)
router.get('/', async (req, res) => {
  try {
    await seedIfEmpty();

    const search = (req.query.search as string || '').toLowerCase();
    const category = req.query.category as string || '';
    const minPrice = Number(req.query.minPrice || 0);
    const maxPrice = Number(req.query.maxPrice || 1000000);
    const minDuration = Number(req.query.minDuration || 0);
    const maxDuration = Number(req.query.maxDuration || 30);
    const sortBy = req.query.sortBy as string || 'rating'; // price-asc, price-desc, rating
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 8);
    const skip = (page - 1) * limit;

    let items: any[] = [];
    let total = 0;

    if (isFallback()) {
      const db = getFallbackDb();
      items = db.itineraries;

      // Filter
      items = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(search) || 
                              item.description.toLowerCase().includes(search) ||
                              item.location.toLowerCase().includes(search);
        const matchesCategory = category === '' || item.category === category;
        const matchesPrice = item.price >= minPrice && item.price <= maxPrice;
        const matchesDuration = item.duration >= minDuration && item.duration <= maxDuration;
        return matchesSearch && matchesCategory && matchesPrice && matchesDuration;
      });

      total = items.length;

      // Sort
      if (sortBy === 'price-asc') {
        items.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        items.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        items.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'date') {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Paginate
      items = items.slice(skip, skip + limit);
    } else {
      // Build MongoDB Query
      const query: any = {};
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) {
        query.category = category;
      }
      query.price = { $gte: minPrice, $lte: maxPrice };
      query.duration = { $gte: minDuration, $lte: maxDuration };

      let sortOptions: any = {};
      if (sortBy === 'price-asc') sortOptions.price = 1;
      else if (sortBy === 'price-desc') sortOptions.price = -1;
      else if (sortBy === 'rating') sortOptions.rating = -1;
      else if (sortBy === 'date') sortOptions.createdAt = -1;

      total = await Itinerary.countDocuments(query);
      items = await Itinerary.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
    }

    return res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return res.status(500).json({ message: 'Error retrieving listings' });
  }
});

// Get individual itinerary details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isFallback()) {
      const db = getFallbackDb();
      const item = db.itineraries.find(i => i.id === id);
      if (!item) return res.status(404).json({ message: 'Itinerary not found' });
      
      // Fetch related items (same category, excluding current one, up to 3)
      const related = db.itineraries
        .filter(i => i.category === item.category && i.id !== id)
        .slice(0, 3);

      return res.json({ item, related });
    } else {
      const item = await Itinerary.findById(id);
      if (!item) return res.status(404).json({ message: 'Itinerary not found' });

      const related = await Itinerary.find({
        category: item.category,
        _id: { $ne: item._id }
      }).limit(3);

      return res.json({ item, related });
    }
  } catch (error) {
    console.error('Error fetching itinerary details:', error);
    return res.status(500).json({ message: 'Error retrieving itinerary details' });
  }
});

// Add new itinerary (protected)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description, fullDescription, price, duration, category, location, image, agenda, specifications } = req.body;

    if (!title || !description || !fullDescription || !price || !duration || !category || !location || !image) {
      return res.status(400).json({ message: 'All primary fields are required' });
    }

    const createdBy = req.user?.id || 'anonymous';

    const newItineraryData = {
      title,
      description,
      fullDescription,
      price: Number(price),
      duration: Number(duration),
      category,
      location,
      image,
      images: [image],
      createdBy,
      createdAt: new Date(),
      rating: 5,
      specifications: specifications || {
        groupSize: 10,
        difficulty: 'Medium',
        includes: [],
        excludes: []
      },
      agenda: agenda || [],
      reviews: []
    };

    if (isFallback()) {
      const db = getFallbackDb();
      const newItem = {
        ...newItineraryData,
        id: `itinerary-user-${Date.now()}`
      };
      db.itineraries.push(newItem);
      saveFallbackDb(db);

      return res.status(201).json(newItem);
    } else {
      const newItinerary = new Itinerary(newItineraryData);
      await newItinerary.save();
      return res.status(201).json(newItinerary);
    }
  } catch (error) {
    console.error('Error creating itinerary:', error);
    return res.status(500).json({ message: 'Error adding itinerary' });
  }
});

// Delete itinerary (protected)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (isFallback()) {
      const db = getFallbackDb();
      const index = db.itineraries.findIndex(i => i.id === id);
      if (index === -1) return res.status(404).json({ message: 'Itinerary not found' });

      // Only allow creator to delete (or seed admin)
      const item = db.itineraries[index];
      if (item.createdBy !== req.user?.id && req.user?.role !== 'planner') {
        return res.status(403).json({ message: 'Not authorized to delete this itinerary' });
      }

      db.itineraries.splice(index, 1);
      saveFallbackDb(db);
      return res.json({ message: 'Itinerary deleted successfully' });
    } else {
      const item = await Itinerary.findById(id);
      if (!item) return res.status(404).json({ message: 'Itinerary not found' });

      if (item.createdBy !== req.user?.id && req.user?.role !== 'planner') {
        return res.status(403).json({ message: 'Not authorized to delete this itinerary' });
      }

      await Itinerary.findByIdAndDelete(id);
      return res.json({ message: 'Itinerary deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return res.status(500).json({ message: 'Error deleting itinerary' });
  }
});

// Add review to itinerary
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, rating, comment } = req.body;

    if (!userName || !rating || !comment) {
      return res.status(400).json({ message: 'All review fields are required' });
    }

    const newReview = {
      userName,
      rating: Number(rating),
      comment,
      date: new Date()
    };

    if (isFallback()) {
      const db = getFallbackDb();
      const index = db.itineraries.findIndex(i => i.id === id);
      if (index === -1) return res.status(404).json({ message: 'Itinerary not found' });

      db.itineraries[index].reviews.push(newReview);
      
      // Recalculate rating
      const reviews = db.itineraries[index].reviews;
      const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
      db.itineraries[index].rating = Number(avgRating.toFixed(1));

      saveFallbackDb(db);
      return res.status(201).json(db.itineraries[index]);
    } else {
      const item = await Itinerary.findById(id);
      if (!item) return res.status(404).json({ message: 'Itinerary not found' });

      item.reviews.push(newReview);

      const avgRating = item.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / item.reviews.length;
      item.rating = Number(avgRating.toFixed(1));

      await item.save();
      return res.status(201).json(item);
    }
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ message: 'Error submitting review' });
  }
});

export default router;
