const cron = require('node-cron');
const mongoose = require('mongoose');

// Import models
const MaintenanceBill = require('../module/Maintenancebill model');
const Notice = require('../module/Notice model');
const Event = require('../module/Event model');
const EmergencyAlert = require('../module/Emergencyalert model');

// Import socket utility
const { toSociety } = require('./socket');

// Cron job to generate monthly maintenance bills
const generateMonthlyBills = async () => {
  try {
    console.log('Running monthly maintenance bill generation...');

    // Get all societies
    const Society = require('../module/Society model');
    const societies = await Society.find({});

    for (const society of societies) {
      // Get all users in the society
      const User = require('../module/User model');
      const users = await User.find({ society: society._id });

      // Calculate maintenance amount (you can customize this logic)
      const maintenanceAmount = society.maintenanceRate || 1000;

      for (const user of users) {
        // Check if bill already exists for current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const existingBill = await MaintenanceBill.findOne({
          user: user._id,
          month: currentMonth,
          year: currentYear
        });

        if (!existingBill) {
          const bill = new MaintenanceBill({
            user: user._id,
            society: society._id,
            amount: maintenanceAmount,
            month: currentMonth,
            year: currentYear,
            dueDate: new Date(currentYear, currentMonth + 1, 10), // Due on 10th of next month
            status: 'pending'
          });

          await bill.save();

          // Notify user via socket
          toSociety(society._id, 'new_bill', {
            billId: bill._id,
            amount: bill.amount,
            dueDate: bill.dueDate
          });
        }
      }
    }

    console.log('Monthly maintenance bill generation completed');
  } catch (error) {
    console.error('Error generating monthly bills:', error);
  }
};

// Cron job to send reminders for overdue bills
const sendBillReminders = async () => {
  try {
    console.log('Sending bill payment reminders...');

    const overdueBills = await MaintenanceBill.find({
      status: 'pending',
      dueDate: { $lt: new Date() }
    }).populate('user society');

    for (const bill of overdueBills) {
      // Send reminder notification
      toSociety(bill.society._id, 'bill_reminder', {
        billId: bill._id,
        amount: bill.amount,
        dueDate: bill.dueDate,
        userId: bill.user._id
      });
    }

    console.log(`Sent reminders for ${overdueBills.length} overdue bills`);
  } catch (error) {
    console.error('Error sending bill reminders:', error);
  }
};

// Cron job to clean up old notices (older than 1 year)
const cleanupOldNotices = async () => {
  try {
    console.log('Cleaning up old notices...');

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await Notice.deleteMany({
      createdAt: { $lt: oneYearAgo }
    });

    console.log(`Cleaned up ${result.deletedCount} old notices`);
  } catch (error) {
    console.error('Error cleaning up old notices:', error);
  }
};

// Cron job to check for upcoming events and send notifications
const checkUpcomingEvents = async () => {
  try {
    console.log('Checking for upcoming events...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingEvents = await Event.find({
      date: {
        $gte: new Date(),
        $lte: tomorrow
      },
      status: 'active'
    }).populate('society');

    for (const event of upcomingEvents) {
      toSociety(event.society._id, 'upcoming_event', {
        eventId: event._id,
        title: event.title,
        date: event.date,
        description: event.description
      });
    }

    console.log(`Found ${upcomingEvents.length} upcoming events`);
  } catch (error) {
    console.error('Error checking upcoming events:', error);
  }
};

// Cron job to check emergency alerts and broadcast them
const broadcastEmergencyAlerts = async () => {
  try {
    console.log('Broadcasting active emergency alerts...');

    const activeAlerts = await EmergencyAlert.find({
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).populate('society');

    for (const alert of activeAlerts) {
      toSociety(alert.society._id, 'emergency_alert', {
        alertId: alert._id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        createdAt: alert.createdAt
      });
    }
  } catch (error) {
    console.error('Error broadcasting emergency alerts:', error);
  }
};

// Initialize all cron jobs
const initCronJobs = () => {
  // Generate monthly bills on the 1st of every month at 9 AM
  cron.schedule('0 9 1 * *', generateMonthlyBills);

  // Send bill reminders daily at 10 AM
  cron.schedule('0 10 * * *', sendBillReminders);

  // Clean up old notices monthly on the 15th at 2 AM
  cron.schedule('0 2 15 * *', cleanupOldNotices);

  // Check for upcoming events daily at 8 AM
  cron.schedule('0 8 * * *', checkUpcomingEvents);

  // Broadcast emergency alerts every 30 minutes
  cron.schedule('*/30 * * * *', broadcastEmergencyAlerts);

  console.log('Cron jobs initialized successfully');
};

module.exports = {
  initCronJobs,
  generateMonthlyBills,
  sendBillReminders,
  cleanupOldNotices,
  checkUpcomingEvents,
  broadcastEmergencyAlerts
};