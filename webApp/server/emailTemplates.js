import mongoose from 'mongoose'
import Handlebars from 'handlebars'

const EmailTemplate = mongoose.model('EmailTemplate', {
  name: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})

function insertTemplates() {
  const templates = [
    {
      name: 'rating',
      subject: "Happy with {{mentorName}}'s advice?",
      message: `Hi,
        <p>
          Based on your email conversation, would you recommend {{mentorName}} to others
          (e.g. your friends and family)?
        </p>
        
        <p>
          <a href="{{yesLink}}">Yes</a> / <a href="{{noLink}}">No</a>
        </p>
        
        Thanks!<br>
        Team Harbor`
    },
    {
      name: 'welcome',
      subject: 'Welcome to Harbor',
      message: `{{mentorName}},
        <p>
          We're excited that you signed up for Harbor!
        </p>
        <p>
          We're a small, bootstrapped, and remote team.
          We built Harbor so that great mentors could give advice and make money in the most
          convenient way - by email.
        </p>
        <p>
          To get started, simply connect your Harbor account to Stripe and start sharing your
          Harbor page: https://app.findharbor.com/contact/{{mentorSlug}}
        </p>
        <ul>
          <li>Advice seekers visit your Harbor page, where they enter their email address,
          message, and payment information.</li>
          <li>All emails sent with Harbor will appear in your gmail folder called "Harbor"</li>
          <li>We verify the payment information and then send the email to your inbox.
          The email will be labeled "Card verified".</li>
          <li>Once you reply, you'll be paid instantly via Stripe, and the original email will
          be re-labeled "Payment successful".</li>
          <li>After you reply, the sender will get an email asking if he/she would recommend
          you to friends and family.</li> 
          <li>If you're unable to reply to an email, the sender won't be charged.</li>
          <li>If the payment doesn't process successfully, the original email will be
          re-labeled "Payment  pending".</li>
          <li>Harbor receives 10% of transaction (this includes transaction fees from Stripe).
          You receive the rest directly in your connected Stripe account.</li>
        </ul>
        Kelly & Timur,
        Team Harbor`
    },
    {
      name: 'googleAccessRevoked',
      subject: 'Re-login required',
      message: `{{mentorName}},
        <p>
          Harbor's access to your Gmail has expired.
          If you wish to continue using Harbor,
          go to https://app.findharbor.com/login?consent=1 and log in.
        </p>
        Team Harbor`
    },
    {
      name: 'tips',
      subject: 'How to promote your Harbor page',
      message: `{{mentorName}},
        <p>Here's the link for your Harbor page: https://app.findharbor.com/contact/{{mentorSlug}} </p>
        <p>Below are some tips to receive more paid emails via Harbor:
        <li>Write a description for your Harbor page.</li>
        <li>Share your link on social media.</li>
        <li>Add your link to your website, blog, books, etc.</li>
        <li>Email your link to newsletter subscribers or customers.</li>
        <li>Include your link in your signature and auto-reply email.</li>
        </p>       
        Team Harbor`
    },
    {
      name: 'settings',
      subject: 'Settings and important links',
      message: `
        <p>
          Your Harbor page: https://app.findharbor.com/contact/{{mentorSlug}}
        </p>
        <p>
          Harbor dashboard: https://app.findharbor.com
        </p>
        <p>
          Stripe dashboard: https://dashboard.stripe.com/dashboard
        </p>
        <p>
          Terms of Service at Harbor: https://www.findharbor.com/terms-of-service
        </p>
        <p>
          Privacy Policy at Harbor: https://www.findharbor.com/privacy-policy
        </p>
        Team Harbor`
    },
    {
      name: 'chargeFailedToCustomer',
      subject: 'Card declined',
      message: `
        <p>{{customerEmail}}, we weren't able to process your payment
        for {{mentorName}}'s advice.</p>
        <p>It could be that your card expired or didn't have sufficient funds.</p>
        <p>
          Please go to this link to pay: https://app.findharbor.com/checkout/{{paymentId}}
        </p>
        <p>
          You will not be able to request advice via Harbor until the payment is complete.
        </p>
      `
    }
  ]

  templates.forEach(async t => {
    if ((await EmailTemplate.find({ name: t.name }).count()) > 0) {
      return
    }

    EmailTemplate.create(
      Object.assign({}, t, { message: t.message.replace(/\n/g, '').replace(/[ ]+/g, ' ') })
    ).catch(() => {
      // just pass error
    })
  })
}

insertTemplates()

async function getEmail({ name, ...params }) {
  const source = await EmailTemplate.findOne({ name })
  if (!source) {
    throw new Error('not found')
  }

  return {
    message: Handlebars.compile(source.message)(params),
    subject: Handlebars.compile(source.subject)(params)
  }
}

export function chargeFailedToCustomer({ mentorName, paymentId, customerEmail }) {
  return getEmail({ name: 'chargeFailedToCustomer', mentorName, paymentId, customerEmail })
}

export function rating({ mentorName, yesLink, noLink }) {
  return getEmail({ name: 'rating', mentorName, yesLink, noLink })
}

export function welcome({ mentorName, mentorSlug }) {
  return getEmail({ name: 'welcome', mentorName, mentorSlug })
}

export function tips({ mentorName, mentorSlug }) {
  return getEmail({ name: 'tips', mentorName, mentorSlug })
}

export function settings({ mentorName, mentorSlug }) {
  return getEmail({ name: 'settings', mentorName, mentorSlug })
}

export function toMentorGoogleAccessRevoked({ mentorName }) {
  return getEmail({ name: 'googleAccessRevoked', mentorName })
}
