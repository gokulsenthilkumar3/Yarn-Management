import { Request, Response } from 'express';
import { demandForecastingService } from './demand-forecasting.service';

export class DemandForecastingController {
    async getForecasts(req: Request, res: Response) {
        try {
            const forecasts = await demandForecastingService.getForecasts();
            res.json(forecasts);
        } catch (error) {
            console.error('Error fetching forecasts:', error);
            res.status(500).json({ error: 'Failed to fetch forecasts' });
        }
    }

    async generateForecasts(req: Request, res: Response) {
        try {
            const result = await demandForecastingService.generateForecasts();
            res.json({ message: 'Forecasts generated successfully', count: result.length, data: result });
        } catch (error) {
            console.error('Error generating forecasts:', error);
            res.status(500).json({ error: 'Failed to generate forecasts' });
        }
    }

    async getNews(req: Request, res: Response) {
        try {
            // Mock News Data (Simulation Service)
            const news = [
                {
                    id: '1',
                    title: 'Cricket World Cup driving Polyester Demand',
                    summary: 'Recent trends show a spike in jersey manufacturing in Tiruppur due to upcoming World Cup.',
                    category: 'Sports',
                    relevanceScore: 95,
                    sentiment: 'POSITIVE',
                    businessImpact: 'Expect 15% increase in Polyester yarn orders.',
                    publishedAt: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'New Sci-Fi Blockbuster "CyberWeave" Released',
                    summary: 'The aesthetic of the new hit movie is influencing fashion trends towards metallic and neon yarns.',
                    category: 'Sci-Fi',
                    relevanceScore: 88,
                    sentiment: 'POSITIVE',
                    businessImpact: 'Specific demand for metallic threads likely to rise.',
                    publishedAt: new Date().toISOString()
                },
                {
                    id: '3',
                    title: 'Cotton Prices Stabilizing in Indian Markets',
                    summary: 'Ministry of Textiles reports a stable supply chain for Q3.',
                    category: 'Economics',
                    relevanceScore: 90,
                    sentiment: 'NEUTRAL',
                    businessImpact: 'Cost of goods sold expected to remain steady.',
                    publishedAt: new Date().toISOString()
                }
            ];
            res.json(news);
        } catch (error) {
            console.error('Error fetching news:', error);
            res.status(500).json({ error: 'Failed to fetch news' });
        }
    }

    async getHistoricalData(req: Request, res: Response) {
        try {
            const data = await demandForecastingService.getHistoricalData();
            res.json(data);
        } catch (error) {
            console.error('Error fetching historical data:', error);
            res.status(500).json({ error: 'Failed to fetch historical data' });
        }
    }
}

export const demandForecastingController = new DemandForecastingController();
