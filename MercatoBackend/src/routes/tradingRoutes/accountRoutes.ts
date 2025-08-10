import express from 'express';
import alpaca from '../../services/alpacaClient';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const account = await alpaca.getAccount();
    res.json(account);
  } catch (error) {
    console.error('Error fetching Alpaca account:', error);
    res.status(500).json({ error: 'Failed to fetch account details' });
  }
});

router.get('/configurations', async (req, res) => {
  try {
    const accountConfigurations = await alpaca.getAccountConfigurations();
    res.json(accountConfigurations);
  } catch (error) {
    console.error('Error fetching Alpaca account configurations:', error);
    res.status(500).json({ error: 'Failed to fetch account configurations' });
  }
})
// work on this after frontend is done
router.patch('/configurations', async (req, res) => {
  try {
    const { key, value } = req.body;
    const accountConfigurations = await alpaca.updateAccountConfigurations(req.body);
    res.json(accountConfigurations);
  } catch (error) {
    console.error('Error updating Alpaca account configurations:', error);
    res.status(500).json({ error: 'Failed to update account configurations' });
  }
})
//understand what these actually are
router.get('/activities', async(req, res) => {
  try {
    const options = {
      activityTypes: req.query.activity_types?.toString().split(",") || undefined,
      date: req.query.date?.toString(),
      until: req.query.until?.toString(),
      after: req.query.after?.toString(),
      direction: req.query.direction?.toString(),
      pageSize: req.query.page_size ? parseInt(req.query.page_size as string, 10) : 100,
      pageToken: req.query.page_token?.toString(),
    };
    const activities = await alpaca.getAccountActivities(options);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching Alpaca account activities:', error);
    res.status(500).json({ error: 'Failed to fetch account activities' });
  }
})
//understand what these actually are
router.get('/activities/:activityType', async(req, res) => {
  try{
    const { activityType } = req.params;
    const options = {
      date: req.query.date?.toString(),
      until: req.query.until?.toString(),
      after: req.query.after?.toString(),
      direction: req.query.direction?.toString(),
      pageSize: req.query.page_size ? parseInt(req.query.page_size as string, 10) : 100,
      pageToken: req.query.page_token?.toString(),
    };
    const activities = await alpaca.getAccountActivities({ ...options, activityTypes: [activityType] });
    res.json(activities);
  } catch (error) {
    console.error(`Error fetching Alpaca account activities for ${req.params.activityType}:`, error);
    res.status(500).json({ error: 'Failed to fetch account activities' });
  }
})


export default router;