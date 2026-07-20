import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

export interface IAgendaItem {
  day: number;
  title: string;
  activities: string[];
}

export interface ISpecifications {
  groupSize: number;
  difficulty: string;
  includes: string[];
  excludes: string[];
}

export interface IItinerary extends Document {
  title: string;
  description: string;
  fullDescription: string;
  price: number;
  duration: number;
  category: string;
  location: string;
  rating: number;
  image: string;
  images: string[];
  createdBy: string;
  createdAt: Date;
  specifications: ISpecifications;
  agenda: IAgendaItem[];
  reviews: IReview[];
}

const ItinerarySchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  fullDescription: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  rating: { type: Number, default: 5 },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  specifications: {
    groupSize: { type: Number, default: 10 },
    difficulty: { type: String, default: 'Medium' },
    includes: { type: [String], default: [] },
    excludes: { type: [String], default: [] }
  },
  agenda: [{
    day: { type: Number, required: true },
    title: { type: String, required: true },
    activities: { type: [String], default: [] }
  }],
  reviews: [{
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
});

export default mongoose.models.Itinerary || mongoose.model<IItinerary>('Itinerary', ItinerarySchema);
