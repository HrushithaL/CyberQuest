const ContactMessage = require("../models/ContactMessage");
const nodemailer = require("nodemailer");

// Create reusable transporter for sending emails
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Submit a contact message (public - no auth required, but will save userId if logged in)
exports.submitContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const messageData = {
            name,
            email,
            subject,
            message
        };

        // If user is authenticated (optional), store their userId
        if (req.user && req.user._id) {
            messageData.userId = req.user._id;
        }

        const contactMessage = await ContactMessage.create(messageData);

        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully!",
            data: contactMessage
        });
    } catch (err) {
        console.error("Error submitting contact message:", err);
        res.status(500).json({ error: "Failed to submit message" });
    }
};

// Get all contact messages (admin only)
exports.getAllContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find()
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        console.error("Error fetching contact messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// Get user's own contact messages (authenticated users)
exports.getUserMessages = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const userId = req.user._id;

        // Find messages by userId or by email (for backwards compatibility)
        const messages = await ContactMessage.find({
            $or: [
                { userId: userId },
                { email: userEmail }
            ]
        }).sort({ createdAt: -1 });

        res.json(messages);
    } catch (err) {
        console.error("Error fetching user messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// Get single contact message (admin only)
exports.getContactMessageById = async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        res.json(message);
    } catch (err) {
        console.error("Error fetching contact message:", err);
        res.status(500).json({ error: "Failed to fetch message" });
    }
};

// Update message status (admin only)
exports.updateMessageStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["unread", "read", "replied", "archived"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.json({ success: true, data: message });
    } catch (err) {
        console.error("Error updating message status:", err);
        res.status(500).json({ error: "Failed to update message" });
    }
};

// Reply to a message and send email (admin only)
exports.replyToMessage = async (req, res) => {
    try {
        const { replyMessage } = req.body;

        if (!replyMessage) {
            return res.status(400).json({ error: "Reply message is required" });
        }

        // Get the original message first
        const originalMessage = await ContactMessage.findById(req.params.id);
        if (!originalMessage) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Try to send email
        let emailSent = false;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = createTransporter();

                await transporter.sendMail({
                    from: `"CyberQuest Support" <${process.env.EMAIL_USER}>`,
                    to: originalMessage.email,
                    subject: `Re: ${originalMessage.subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #00ff88, #00d4ff); padding: 20px; text-align: center;">
                                <h1 style="color: #000; margin: 0;">CyberQuest</h1>
                            </div>
                            <div style="padding: 30px; background: #0a0e27; color: #fff;">
                                <p style="color: #00ff88;">Hello ${originalMessage.name},</p>
                                <p>Thank you for contacting us. Here's our response to your inquiry:</p>
                                <div style="background: rgba(0,255,136,0.1); border-left: 4px solid #00ff88; padding: 15px; margin: 20px 0;">
                                    ${replyMessage.replace(/\n/g, '<br>')}
                                </div>
                                <hr style="border-color: rgba(255,255,255,0.1); margin: 20px 0;">
                                <p style="color: rgba(255,255,255,0.6); font-size: 12px;">Your original message:</p>
                                <p style="color: rgba(255,255,255,0.5); font-style: italic;">"${originalMessage.message}"</p>
                            </div>
                            <div style="background: #050816; padding: 15px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px;">
                                &copy; 2024 CyberQuest. All rights reserved.
                            </div>
                        </div>
                    `
                });
                emailSent = true;
            } catch (emailErr) {
                console.error("Error sending email:", emailErr);
            }
        }

        // Update message in database
        const updatedMessage = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            {
                status: "replied",
                replyMessage,
                repliedAt: new Date()
            },
            { new: true }
        );

        res.json({
            success: true,
            emailSent,
            message: emailSent ? "Reply sent successfully!" : "Reply saved but email not sent (email not configured)",
            data: updatedMessage
        });
    } catch (err) {
        console.error("Error replying to message:", err);
        res.status(500).json({ error: "Failed to reply to message" });
    }
};

// Delete a message (admin only)
exports.deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.json({ success: true, message: "Message deleted successfully" });
    } catch (err) {
        console.error("Error deleting contact message:", err);
        res.status(500).json({ error: "Failed to delete message" });
    }
};

// Get unread message count (admin only)
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await ContactMessage.countDocuments({ status: "unread" });
        res.json({ count });
    } catch (err) {
        console.error("Error fetching unread count:", err);
        res.status(500).json({ error: "Failed to fetch unread count" });
    }
};
