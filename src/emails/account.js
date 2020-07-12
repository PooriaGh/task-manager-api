const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'pooriagholami111@gmail.com',
    subject: 'Thank you for joining us!',
    text: `Welcome to our app, ${name}`,
  });
};

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'pooriagholami111@gmail.com',
    subject: 'Sorry to see you go!',
    text: `Dear ${name}, send us your feedback, we using it to improve our services.`,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
