import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { isFallback, getFallbackDb } from '../config/db';
import Itinerary from '../models/Itinerary';

const router = Router();

// Initialize Gemini Client if Key exists
let aiClient: any = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  try {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
    console.log('✅ Gemini AI client successfully configured.');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI client:', error);
  }
}

// 1. AI Content Generator: Itinerary Planner (/api/ai/generate)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { destination, duration, budget, style, detailLevel } = req.body;

    if (!destination || !duration || !budget || !style) {
      return res.status(400).json({ message: 'Destination, duration, budget, and travel style are required' });
    }

    const days = Math.min(Math.max(Number(duration), 1), 14); // Clamp between 1 and 14 days
    const isDetailed = detailLevel === 'detailed';

    // If Gemini API client is available, use it!
    if (aiClient) {
      try {
        const prompt = `
          Generate a detailed travel itinerary for a trip to "${destination}" for ${days} days with a budget of $${budget} and style "${style}".
          Output the response in strict JSON format matching this schema:
          {
            "title": "A catchy title for the trip",
            "description": "A short 1-2 sentence description",
            "fullDescription": "A longer 3-4 sentence overview of the trip experience",
            "category": "${style}",
            "price": ${budget},
            "duration": ${days},
            "location": "${destination}",
            "specifications": {
              "groupSize": 10,
              "difficulty": "Medium",
              "includes": ["Include 3-4 key inclusions"],
              "excludes": ["Include 2-3 key exclusions"]
            },
            "agenda": [
              {
                "day": 1,
                "title": "Title of Day 1",
                "activities": ["Activity 1", "Activity 2", "Activity 3"]
              }
              // Add entries up to day ${days}
            ]
          }
          Return ONLY valid raw JSON. No markdown ticks, no additional text.
        `;

        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        const textResponse = response.text || '';
        // Strip out any markdown formatting if present
        const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const generatedItinerary = JSON.parse(jsonString);

        // Inject default image based on destination category
        generatedItinerary.image = getCategoryImage(style);
        return res.json(generatedItinerary);
      } catch (geminiError) {
        console.error('Gemini content generation failed, falling back to mock generator:', geminiError);
      }
    }

    // Mock Content Generator Fallback
    const mockItinerary = generateMockItinerary(destination, days, Number(budget), style, isDetailed);
    return res.json(mockItinerary);
  } catch (error) {
    console.error('AI generation error:', error);
    return res.status(500).json({ message: 'Error generating AI itinerary' });
  }
});

// Helper for category images
const getCategoryImage = (style: string): string => {
  const styles: Record<string, string> = {
    Adventure: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    Relax: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    Cultural: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    Family: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=800&q=80"
  };
  return styles[style] || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80";
};

// Generates rich mock itinerary
const generateMockItinerary = (dest: string, days: number, budget: number, style: string, isDetailed: boolean) => {
  const activitiesByStyle: Record<string, string[]> = {
    Adventure: [
      "Guided off-road quad biking session through nature paths",
      "Wildwater rafting adventure with certified instructors",
      "Sunset zip-lining course over canyons and forest canopy",
      "Early morning peak hiking climb with panoramic photography opportunity",
      "Wilderness navigation course and campfire survival skills demo",
      "Scenic mountain biking trail tour through mountain ridges",
      "Caving exploration with specialized guide and equipment"
    ],
    Relax: [
      "Leisurely morning walk through coastal botanical gardens",
      "Premium mud baths and geothermal mineral spa relaxation session",
      "Sunset yoga session led by a certified local practitioner",
      "Private sailing yacht charter with chef-curated seafood lunch",
      "Afternoon tea tasting and book reading in a garden conservatory",
      "Gentle beach stroll followed by an oceanfront dinner",
      "Aromatherapy hot-stone massage and wellness consultation"
    ],
    Cultural: [
      "Private historical museum tour guided by a senior curator",
      "Hands-on local pottery making class led by master artisan",
      "Evening street food tour sampling authentic culinary delights",
      "Interactive traditional textile weaving workshop",
      "Guided walking tour of ancient architectural ruins and cathedrals",
      "Classical music performance or theatrical show at historic playhouse",
      "Traditional cooking masterclass learning signature regional recipes"
    ],
    Family: [
      "Interactive exhibits and live shows at local Science Center",
      "Day trip to a wildlife preservation reserve with guided animal encounters",
      "Outdoor picnic in the park with fun team-building games",
      "Bicycle rentals along safe scenic family pathway lanes",
      "Chocolate factory tour and personalized candy crafting station",
      "Amusement park rides and live evening light display parade",
      "Scavenger hunt exploring historic town centers and landmarks"
    ]
  };

  const pool = activitiesByStyle[style] || activitiesByStyle['Relax'];
  const agenda = [];

  for (let i = 1; i <= days; i++) {
    const mainAct = pool[(i - 1) % pool.length];
    const secondaryAct = pool[(i * 2) % pool.length];
    
    const dayActivities = [
      `Morning: ${mainAct}`,
      `Afternoon: ${secondaryAct}`,
      `Evening: Dining at local chef-recommended restaurant`
    ];

    if (isDetailed) {
      dayActivities.push(`Logistics: Ground transport departs hotel at 8:30 AM. Pack light daypack and comfortable footwear.`);
    }

    agenda.push({
      day: i,
      title: `Exploring the Wonders of ${dest} - Day ${i}`,
      activities: dayActivities
    });
  }

  const inclusions = {
    Adventure: ["All safety gear & harnesses", "Qualified outdoor guides", "Hydration packs & trail bars", "Hotel transfers"],
    Relax: ["All spa treatments & towels", "Ryokan/Wellness lodge stays", "Daily organic breakfast", "Airport pick-up"],
    Cultural: ["Museum and temple passes", "Dedicated local guides", "Cooking school class fees", "Private town transport"],
    Family: ["Family-size rental vehicle", "All amusement park entrance tickets", "Child-friendly activity kits", "Daily buffet meals"]
  };

  const exclusions = {
    Adventure: ["Personal medical insurance", "Extreme sports climbing gear"],
    Relax: ["Alcoholic beverages beyond tastings", "Souvenirs and shopping spree"],
    Cultural: ["Additional guide tips", "Camera permits inside specific inner temples"],
    Family: ["Stroller rentals (available on-site)", "Adult beverage items"]
  };

  return {
    title: `Lumina ${style} Escape: Discover ${dest}`,
    description: `A customized ${days}-day ${style.toLowerCase()} journey in beautiful ${dest} tailored for a budget of $${budget}.`,
    fullDescription: `This tailor-made itinerary unlocks the premier experiences in ${dest}. Designed to perfectly fit your preference for ${style.toLowerCase()} travel, you will dive deep into local sights, stay at comfortable accommodations, and enjoy curated highlights, keeping your overall budget of $${budget} in mind.`,
    category: style,
    price: budget,
    duration: days,
    location: dest,
    image: getCategoryImage(style),
    specifications: {
      groupSize: style === 'Adventure' ? 8 : (style === 'Family' ? 12 : 10),
      difficulty: style === 'Adventure' ? 'Hard' : (style === 'Cultural' ? 'Medium' : 'Easy'),
      includes: inclusions[style as keyof typeof inclusions] || inclusions['Relax'],
      excludes: exclusions[style as keyof typeof exclusions] || exclusions['Relax']
    },
    agenda
  };
};

// 2. AI Travel Co-Pilot Chat (/api/ai/chat)
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'User message is required' });
    }

    // Get current database context to make the AI assistant context-aware
    let itinerariesContext = '';
    try {
      if (isFallback()) {
        const db = getFallbackDb();
        itinerariesContext = JSON.stringify(db.itineraries.map(i => ({ id: i.id, title: i.title, location: i.location, price: i.price, category: i.category })));
      } else {
        const items = await Itinerary.find({}, 'title location price category');
        itinerariesContext = JSON.stringify(items);
      }
    } catch (err) {
      console.error('Error compiling chat database context:', err);
    }

    if (aiClient) {
      try {
        const chatPrompt = `
          You are "Lumina Co-Pilot", an intelligent, friendly AI Travel Assistant for the LuminaPlan AI application.
          You help users find itineraries, plan travels, and navigate the application.
          
          Application Context (Available Itineraries on the site):
          ${itinerariesContext}
          
          User Message: "${message}"
          
          Use the application context to answer. If a user asks for matching trips, mention the exact trip name, price, and category, and provide a direct text recommendation.
          Keep your response concise, engaging, and professional.
        `;

        const chatHistoryFormatted = (history || []).map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        chatHistoryFormatted.push({
          role: 'user',
          parts: [{ text: chatPrompt }]
        });

        const chatSession = aiClient.chats.create({
          model: 'gemini-2.5-flash',
          history: chatHistoryFormatted.slice(0, -1) // pass historical turns
        });

        const result = await chatSession.sendMessage({
          message: chatPrompt
        });

        return res.json({
          response: result.text || 'I am here to assist with your travel planning!'
        });
      } catch (geminiChatError) {
        console.error('Gemini Chat failed, falling back to mock assistant:', geminiChatError);
      }
    }

    // Mock Chat Assistant Fallback
    const responseText = getMockChatResponse(message, itinerariesContext);
    
    // Simulate slight typing latency (500ms)
    setTimeout(() => {
      return res.json({ response: responseText });
    }, 500);

  } catch (error) {
    console.error('AI Chat error:', error);
    return res.status(500).json({ message: 'Error processing AI chat query' });
  }
});

const getMockChatResponse = (msg: string, dbContext: string): string => {
  const query = msg.toLowerCase();
  let dbItems: any[] = [];
  try {
    dbItems = JSON.parse(dbContext || '[]');
  } catch (e) {}

  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    return "Hello! I am your Lumina Co-Pilot. I can help you find travel packages, design customized day-by-day itineraries, or analyze your travel budget. What destination are you thinking of exploring today?";
  }

  if (query.includes('adventure') || query.includes('hike') || query.includes('climb') || query.includes('trek')) {
    const advList = dbItems.filter(i => i.category === 'Adventure');
    if (advList.length > 0) {
      const matchText = advList.map(i => `• **${i.title}** in ${i.location} (priced at $${i.price})`).join('\n');
      return `We have some amazing **Adventure** packages in our catalog!\n\n${matchText}\n\nWould you like me to take you to the Explore page, or should we design a completely custom itinerary here?`;
    }
    return "Adventure awaits! I recommend checking out our mountain expeditions. You can navigate to our **Explore** tab and filter by the 'Adventure' category to see our latest packages.";
  }

  if (query.includes('relax') || query.includes('beach') || query.includes('spa') || query.includes('luxury')) {
    const relaxList = dbItems.filter(i => i.category === 'Relax');
    if (relaxList.length > 0) {
      const matchText = relaxList.map(i => `• **${i.title}** in ${i.location} (priced at $${i.price})`).join('\n');
      return `For absolute relaxation, check out these packages:\n\n${matchText}\n\nI can help you customize any of these. Which one sounds perfect for you?`;
    }
    return "Time to wind down! I recommend our Amalfi Coast or Bora Bora getaways. Go to the **Explore** tab and choose the 'Relax' category to browse our tranquil destinations.";
  }

  if (query.includes('how to add') || query.includes('create a trip') || query.includes('add itinerary')) {
    return "To create a trip, make sure you are logged in and navigate to the **Add Itinerary** page in the top menu. There, you can input your trip's title, description, price, duration, category, and daily agenda. Once submitted, it will show up on our Explore page!";
  }

  if (query.includes('budget') || query.includes('expense') || query.includes('analyze')) {
    return "I can definitely help with your travel budgets! You can navigate to the **AI Hub** page and open the 'Budget Analyzer' tab. Simply upload a CSV or JSON file of your trip expenses, and I will generate detailed breakdown charts and insights!";
  }

  return `I understand you are asking about "${msg}". As your Lumina Co-Pilot, I can recommend looking at our active tours in our database. We have curated trips to Switzerland, Japan, Italy, and Tanzania. Let me know if you would like recommendations for a specific budget or category!`;
};

// 3. AI Data Analyzer: Budget Expense Parser (/api/ai/analyze)
router.post('/analyze', (req: Request, res: Response) => {
  try {
    const { expenses, targetBudget } = req.body;

    if (!expenses || !Array.isArray(expenses)) {
      return res.status(400).json({ message: 'An array of expense objects is required' });
    }

    const limitBudget = Number(targetBudget || 2000);

    // Calculate details
    let totalSpent = 0;
    const categoryTotals: Record<string, number> = {
      Accommodation: 0,
      Food: 0,
      Transport: 0,
      Activities: 0,
      Others: 0
    };

    expenses.forEach((item: any) => {
      const amount = Number(item.amount || 0);
      totalSpent += amount;

      const cat = item.category || 'Others';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += amount;
      } else {
        categoryTotals['Others'] += amount;
      }
    });

    const categoriesChartData = Object.keys(categoryTotals).map(key => ({
      name: key,
      value: categoryTotals[key]
    }));

    const status = totalSpent > limitBudget ? 'Over Budget' : 'Under Budget';
    const difference = Math.abs(limitBudget - totalSpent);
    const variancePercentage = ((totalSpent / limitBudget) * 100).toFixed(1);

    // AI Insight generation (Mocked/Rule-based or Gemini if active)
    let insights = [
      `Your total expenditure is $${totalSpent.toFixed(2)}, which is ${variancePercentage}% of your target budget ($${limitBudget.toFixed(2)}).`,
      `You are currently ${status.toLowerCase()} by $${difference.toFixed(2)}.`
    ];

    // Category specific savings advice
    if (categoryTotals.Accommodation > limitBudget * 0.4) {
      insights.push("Lodging represents a significant portion of your spending. Consider booking stays further from downtown areas, or explore guesthouse options to save up to 20%.");
    }
    if (categoryTotals.Food > limitBudget * 0.25) {
      insights.push("Food expenditures are high. Try visiting local grocery markets for breakfast, or sample regional street food rather than sit-down restaurants for lunch.");
    }
    if (categoryTotals.Transport > limitBudget * 0.2) {
      insights.push("Transport represents a major budget item. Research multi-day city transit cards or walking tours to reduce taxi or private rental costs.");
    }
    if (categoryTotals.Activities > limitBudget * 0.3) {
      insights.push("Activity and entrance ticket costs are rising. Booking museum passes in bundles online or seeking free walking tours can help stabilize this category.");
    }

    if (insights.length <= 2) {
      insights.push("Your expenses are well-distributed across categories. Keep maintaining your daily ledger to stay on track!");
    }

    // Generate downloadable HTML report contents
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>LuminaPlan AI - Travel Budget Analysis Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; background-color: #fafafa; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          h1 { color: #0d1b2a; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-bottom: 30px; }
          .summary-card { background: #f4f6f8; border-left: 5px solid #d4af37; padding: 20px; border-radius: 4px; margin-bottom: 30px; }
          .kpi-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .kpi { flex: 1; text-align: center; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; margin-right: 15px; border-radius: 6px; }
          .kpi:last-child { margin-right: 0; }
          .kpi-value { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 5px; }
          .insight-list { background: #fefcf0; border: 1px solid #fef3c7; padding: 25px; border-radius: 8px; }
          .insight-item { margin-bottom: 12px; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>LuminaPlan Budget Analysis</h1>
          <div class="summary-card">
            <strong>Budget Status:</strong> ${status} (${variancePercentage}% of target)
          </div>
          <div class="kpi-row">
            <div class="kpi">
              <div>Target Budget</div>
              <div class="kpi-value">$${limitBudget.toFixed(2)}</div>
            </div>
            <div class="kpi">
              <div>Total Spent</div>
              <div class="kpi-value">$${totalSpent.toFixed(2)}</div>
            </div>
            <div class="kpi">
              <div>${status === 'Over Budget' ? 'Excessive' : 'Remaining'}</div>
              <div class="kpi-value">$${difference.toFixed(2)}</div>
            </div>
          </div>
          <div class="insight-list">
            <h3>AI Recommendations & Insights</h3>
            <ul>
              ${insights.map(i => `<li class="insight-item">${i}</li>`).join('')}
            </ul>
          </div>
          <div class="footer">
            Generated by LuminaPlan AI Co-Pilot on ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;

    return res.json({
      chartData: categoriesChartData,
      totalSpent,
      status,
      difference,
      insights,
      reportHtml
    });

  } catch (error) {
    console.error('AI Expense analysis error:', error);
    return res.status(500).json({ message: 'Error analyzing expenses' });
  }
});

export default router;
