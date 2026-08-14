import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — MailReply AI" },
      { name: "description", content: "Terms of Service for MailReply AI" },
    ],
  }),
  component: TermsOfService,
});

function TermsOfService() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose prose-slate prose-headings:font-display prose-headings:font-semibold prose-a:text-primary dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: August 14, 2026</p>

          <p>Welcome to MailReply AI.</p>
          <p>
            These Terms of Service ("Terms") govern your access to and use of the MailReply AI website, Chrome extension, Gmail integration, AI-powered reply assistant, and related services (collectively, the "Service").
          </p>
          <p>
            By accessing or using MailReply AI, you agree to these Terms. If you do not agree with these Terms, please do not use the Service.
          </p>

          <h2 className="text-2xl mt-8 mb-4">1. About MailReply AI</h2>
          <p>MailReply AI is an AI-powered email productivity assistant designed to help users understand Gmail conversations and generate suggested email replies.</p>
          <p>The Service may allow you to:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Connect a Google/Gmail account.</li>
            <li>Read an authorized Gmail conversation for the purpose of providing the requested assistance.</li>
            <li>Generate an AI-assisted reply based on conversation context.</li>
            <li>Provide custom instructions for generating a response.</li>
            <li>Modify or regenerate a suggested response.</li>
            <li>Insert an approved response into the Gmail reply composer.</li>
            <li>Review and edit generated content before sending it.</li>
          </ul>
          <p><strong>MailReply AI is an assistance tool and does not replace your own judgment when communicating by email.</strong></p>

          <h2 className="text-2xl mt-8 mb-4">2. Eligibility</h2>
          <p>You must be legally permitted to use the Service under the laws applicable to you.</p>
          <p>By using MailReply AI, you represent that:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>You have the authority to use the Google account you connect.</li>
            <li>You have permission to access the email information processed through the Service.</li>
            <li>You will comply with applicable laws and regulations.</li>
            <li>You will use the Service only for lawful purposes.</li>
          </ul>
          <p>If you use MailReply AI on behalf of a business or organization, you represent that you have the authority to accept these Terms on its behalf.</p>

          <h2 className="text-2xl mt-8 mb-4">3. Google Account and Gmail Access</h2>
          <p>Certain features require you to connect a Google account. When you connect Gmail:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Google handles the authentication process.</li>
            <li>You authorize the permissions displayed by Google.</li>
            <li>MailReply AI accesses Gmail information only according to the permissions granted and the functionality provided.</li>
          </ul>
          <p>You remain responsible for the Google account and email communications associated with your account. You may revoke MailReply AI's access to your Google account through Google's account-management tools. If you revoke required permissions, certain Gmail-related features may no longer work.</p>

          <h2 className="text-2xl mt-8 mb-4">4. AI-Generated Content</h2>
          <p>MailReply AI uses artificial intelligence to generate suggested email replies. AI-generated content can contain:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Inaccuracies</li>
            <li>Incorrect assumptions</li>
            <li>Missing context</li>
            <li>Incorrect tone</li>
            <li>Outdated or incomplete information</li>
            <li>Unintended wording</li>
          </ul>
          <p>AI-generated content should therefore be treated as a draft or suggestion, not as guaranteed factual information. You are responsible for reviewing generated responses before using or sending them.</p>

          <h2 className="text-2xl mt-8 mb-4">5. User Responsibility for Email Content</h2>
          <p>You are solely responsible for the emails you send using or with assistance from MailReply AI. Before sending an email, you should verify:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>The recipient and the recipient's address</li>
            <li>The subject</li>
            <li>The accuracy of the content</li>
            <li>Names, dates, prices, and financial information</li>
            <li>Deadlines and commitments</li>
            <li>Attachments and links</li>
            <li>Confidential or sensitive information</li>
            <li>Any statements generated by AI</li>
          </ul>
          <p>MailReply AI does not guarantee that a generated response is appropriate for your specific business, legal, financial, professional, or personal circumstances.</p>

          <h2 className="text-2xl mt-8 mb-4">6. No Automatic Sending</h2>
          <p>MailReply AI is designed to keep the user in control of email sending. Unless a separately documented feature explicitly states otherwise:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>MailReply AI does not automatically send emails.</li>
            <li>The user is responsible for reviewing, approving, and sending the final email through Gmail.</li>
          </ul>
          <p>You should never rely on MailReply AI as an autonomous email-sending system.</p>

          <h2 className="text-2xl mt-8 mb-4">7. Custom Instructions</h2>
          <p>MailReply AI may allow you to provide custom instructions for generating replies. You are responsible for the instructions you provide. You must not use custom instructions to:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Violate applicable law</li>
            <li>Circumvent security controls</li>
            <li>Access another person's information without authorization</li>
            <li>Generate fraudulent or deceptive communications</li>
            <li>Facilitate harmful or abusive activity</li>
            <li>Attempt to extract confidential system information</li>
            <li>Circumvent third-party service restrictions</li>
          </ul>
          <p>MailReply AI may restrict or refuse requests that violate these Terms or applicable laws.</p>

          <h2 className="text-2xl mt-8 mb-4">8. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Violate any applicable law or regulation or infringe intellectual property or privacy rights.</li>
            <li>Access accounts, messages, or systems without authorization.</li>
            <li>Attempt to bypass Google, Gmail, Chrome, or MailReply AI security controls.</li>
            <li>Distribute malware, malicious code, or harmful software.</li>
            <li>Conduct phishing, impersonation, fraud, or deceptive activity.</li>
            <li>Harass, threaten, or abuse others or generate unlawful content.</li>
            <li>Interfere with the availability or security of the Service.</li>
            <li>Reverse engineer or attempt to obtain source code except where permitted by applicable law.</li>
            <li>Circumvent usage limits, authentication mechanisms, or access controls.</li>
            <li>Use automated methods to abuse the Service or third-party systems.</li>
            <li>Use the Service in a way that violates Google's terms, policies, or Gmail API requirements.</li>
          </ul>
          <p>We reserve the right to investigate suspected misuse and take reasonable action.</p>

          <h2 className="text-2xl mt-8 mb-4">9. Third-Party Services</h2>
          <p>MailReply AI may depend on or integrate with third-party services, including Google, Gmail API, Google OAuth, AI providers, hosting providers, authentication providers, infrastructure providers, and browser platforms.</p>
          <p>These third-party services may have their own terms, policies, technical requirements, and availability limitations. Your use of third-party services is subject to their applicable terms and policies. MailReply AI is not responsible for changes, interruptions, restrictions, or failures caused by third-party services outside our reasonable control.</p>

          <h2 className="text-2xl mt-8 mb-4">10. AI Provider Configuration</h2>
          <p>Depending on the version and configuration of the Service, you may be able to select or configure an AI provider. You are responsible for:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Providing valid configuration information and keeping API credentials secure.</li>
            <li>Selecting an AI provider appropriate for your intended use.</li>
            <li>Reviewing the provider's applicable terms and privacy practices.</li>
            <li>Ensuring your use of the provider complies with its policies.</li>
          </ul>
          <p>MailReply AI does not guarantee the availability, accuracy, performance, pricing, or policies of third-party AI providers.</p>

          <h2 className="text-2xl mt-8 mb-4">11. Privacy</h2>
          <p>Your use of MailReply AI is also governed by our Privacy Policy. The Privacy Policy describes how we handle information, including information accessed through Google APIs and Gmail. You can review the Privacy Policy at: <a href="https://mailreplyai.vercel.app/privacy-policy">https://mailreplyai.vercel.app/privacy-policy</a></p>
          <p>If there is a conflict between these Terms and the Privacy Policy regarding the handling of personal information, the Privacy Policy will govern that specific issue.</p>

          <h2 className="text-2xl mt-8 mb-4">12. Intellectual Property</h2>
          <p>The Service, including its software, design, branding, logos, interface, documentation, and original content, is owned by or licensed to MailReply AI and is protected by applicable intellectual property laws.</p>
          <p>Except as expressly permitted by these Terms, you may not:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Copy the Service or reproduce proprietary interface elements.</li>
            <li>Redistribute the software or modify proprietary source code.</li>
            <li>Create derivative works from proprietary components.</li>
            <li>Remove copyright, trademark, or proprietary notices.</li>
            <li>Use MailReply AI branding in a way that suggests unauthorized affiliation.</li>
          </ul>
          <p>You retain ownership of content that you provide to the Service, subject to the rights necessary for MailReply AI to provide the Service.</p>

          <h2 className="text-2xl mt-8 mb-4">13. Your Content</h2>
          <p>You retain your rights to the email content, instructions, and other information you provide through the Service, subject to the permissions and rights necessary to operate the Service. By using MailReply AI, you grant us only the limited rights necessary to provide the Service, process authorized data as described in our Privacy Policy, maintain and secure the Service, diagnose technical problems, and comply with legal obligations. We do not claim ownership of your email content.</p>

          <h2 className="text-2xl mt-8 mb-4">14. Availability</h2>
          <p>We strive to keep MailReply AI available and reliable, but we do not guarantee that the Service will always be available, uninterrupted, error-free, compatible with every Gmail interface version, compatible with every browser configuration, or compatible with every third-party AI provider.</p>
          <p>Gmail and other third-party services may change their interfaces, APIs, permissions, policies, or technical requirements, which may affect functionality. We may temporarily suspend features for maintenance, security updates, infrastructure changes, bug fixes, third-party API changes, compliance requirements, or emergency situations.</p>

          <h2 className="text-2xl mt-8 mb-4">15. Gmail and Browser Compatibility</h2>
          <p>MailReply AI interacts with Gmail through supported APIs and/or browser-extension functionality. Because Gmail is a third-party platform and its web interface may change, we cannot guarantee permanent compatibility with every Gmail layout or interface behavior. If Gmail changes its technical implementation, some features may temporarily stop working until compatibility updates are released.</p>

          <h2 className="text-2xl mt-8 mb-4">16. Security</h2>
          <p>We take reasonable measures to protect the Service and information processed through it. However, no internet service, software application, API, or data transmission can be guaranteed to be completely secure.</p>
          <p>You are responsible for:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Protecting your Google account and device.</li>
            <li>Keeping API credentials confidential.</li>
            <li>Using a secure browser and operating system.</li>
            <li>Immediately reporting suspected unauthorized access.</li>
          </ul>
          <p>Do not provide passwords, authentication secrets, or other credentials to the AI reply field.</p>

          <h2 className="text-2xl mt-8 mb-4">17. Account Suspension or Termination</h2>
          <p>We may suspend or terminate access to the Service if we reasonably believe that you violated these Terms, used the Service unlawfully, attempted to compromise the Service or another user's account, your use creates a security or operational risk, your use violates Google or another third-party provider's policies, or suspension is required for legal or regulatory reasons.</p>
          <p>You may stop using MailReply AI at any time. Where appropriate, we may provide notice before termination, although immediate suspension may be necessary for security, abuse prevention, or legal reasons.</p>

          <h2 className="text-2xl mt-8 mb-4">18. Effect of Termination</h2>
          <p>After you stop using MailReply AI or your access is terminated, you may no longer be able to use the Service. Gmail-related functionality will stop if required authorization is revoked. Data handling will continue according to our Privacy Policy and applicable legal obligations. Termination does not eliminate obligations that by their nature should survive termination, including provisions concerning intellectual property, disclaimers, limitations of liability, and dispute-related provisions.</p>

          <h2 className="text-2xl mt-8 mb-4">19. Disclaimers</h2>
          <p>To the maximum extent permitted by applicable law, MailReply AI is provided on an "as is" and "as available" basis. We do not guarantee that AI-generated replies will be accurate, suitable for every situation, or achieve a particular business or communication outcome. You use AI-generated content at your own discretion and risk.</p>

          <h2 className="text-2xl mt-8 mb-4">20. Professional Advice Disclaimer</h2>
          <p>MailReply AI is a productivity and communication assistance tool. It does not provide legal advice, financial advice, medical advice, tax advice, professional regulatory advice, or guaranteed business advice. Do not rely solely on an AI-generated email when communicating information that requires professional review.</p>

          <h2 className="text-2xl mt-8 mb-4">21. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, MailReply AI and its owners, operators, affiliates, service providers, and licensors will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from or related to your use of the Service. This may include losses related to incorrect AI-generated content, email communication errors, missed deadlines, business losses, lost opportunities, data loss, service interruptions, Gmail or third-party service failures, or unauthorized access resulting from circumstances outside our reasonable control. Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited under applicable law.</p>

          <h2 className="text-2xl mt-8 mb-4">22. Indemnification</h2>
          <p>To the extent permitted by applicable law, you agree to defend, indemnify, and hold harmless MailReply AI and its owners, operators, affiliates, service providers, and licensors from claims, damages, liabilities, costs, and expenses arising from your misuse of the Service, violation of these Terms, violation of applicable law, violation of another person's rights, content or communications that you send using the Service, or unauthorized use of third-party accounts or services.</p>

          <h2 className="text-2xl mt-8 mb-4">23. Changes to the Service</h2>
          <p>We may modify, add, remove, or discontinue features of MailReply AI from time to time. Changes may include new AI providers, new Gmail functionality, new reply features, interface changes, security changes, changes to supported browsers, or changes to available plans or pricing. We may discontinue specific features where necessary for technical, legal, security, or business reasons.</p>

          <h2 className="text-2xl mt-8 mb-4">24. Changes to These Terms</h2>
          <p>We may update these Terms periodically. When we make material changes, we may provide notice through the Service or another reasonable method. The Last Updated date at the top of these Terms indicates when they were most recently revised. Your continued use of the Service after updated Terms become effective constitutes acceptance of the revised Terms, to the extent permitted by applicable law.</p>

          <h2 className="text-2xl mt-8 mb-4">25. Governing Law</h2>
          <p>These Terms are governed by the laws of Jaipur, Rajasthan, India, without regard to conflict-of-law principles, unless applicable law requires otherwise. Any disputes will be handled by the courts or dispute-resolution process applicable to Jaipur, Rajasthan, subject to mandatory rights you may have under applicable law.</p>

          <h2 className="text-2xl mt-8 mb-4">26. Severability</h2>
          <p>If any provision of these Terms is determined to be invalid or unenforceable, that provision will be interpreted to the maximum extent permitted by law, and the remaining provisions will remain in full force and effect.</p>

          <h2 className="text-2xl mt-8 mb-4">27. Entire Agreement</h2>
          <p>These Terms, together with the Privacy Policy and any other policies or agreements expressly referenced by these Terms, constitute the agreement between you and MailReply AI regarding your use of the Service. They supersede prior agreements or understandings concerning the Service, except where a separate written agreement expressly applies.</p>

          <h2 className="text-2xl mt-8 mb-4">28. Contact</h2>
          <p>For questions, support requests, or legal inquiries regarding these Terms, contact:</p>
          <div className="bg-muted/30 p-4 rounded-lg mt-4 mb-8 text-sm">
            <p><strong>MailReply AI</strong></p>
            <p><strong>Website:</strong> <a href="https://mailreplyai.vercel.app">https://mailreplyai.vercel.app</a></p>
            <p><strong>Support Email:</strong> <a href="mailto:anilkumar.apexweb.cube@gmail.com">anilkumar.apexweb.cube@gmail.com</a></p>
            <p><strong>Legal Email:</strong> <a href="mailto:anilkumar.apexweb.cube@gmail.com">anilkumar.apexweb.cube@gmail.com</a></p>
            <p><strong>Business Address:</strong> Pratap Nagar, Jaipur, Rajasthan</p>
          </div>

          <h2 className="text-2xl mt-8 mb-4">29. Google API Compliance</h2>
          <p>MailReply AI uses Google APIs and Gmail-related services. Your use of MailReply AI's Google integration is also subject to applicable Google terms and policies. MailReply AI's use of information received from Google APIs is intended to comply with Google's applicable API Services User Data Policy, including applicable Limited Use requirements. Nothing in these Terms grants MailReply AI permission to use Google user data beyond what is necessary and permitted to provide the Service. Where Google's policies impose additional requirements on our use of Google user data, those requirements will apply.</p>

          <h2 className="text-2xl mt-8 mb-4">30. Acceptance</h2>
          <p>By clicking "Connect Gmail," installing the MailReply AI extension, creating an account, accessing the Service, or otherwise using MailReply AI, you acknowledge that you have read and agree to these Terms of Service and the applicable Privacy Policy. If you do not agree, do not use the Service or connect your Google account.</p>

        </article>
      </main>
    </Shell>
  );
}
