import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "@/components/layout/Shell";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MailReply AI" },
      { name: "description", content: "Privacy Policy for MailReply AI" },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="prose prose-slate prose-headings:font-display prose-headings:font-semibold prose-a:text-primary dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: August 14, 2026</p>

          <p>
            MailReply AI ("MailReply AI", "we", "us", or "our") provides an AI-powered email reply assistant that helps users understand Gmail conversations and create reply drafts based on the conversation context and the user's instructions.
          </p>
          <p>
            This Privacy Policy explains how we collect, access, use, process, store, protect, and share information when you use the MailReply AI website, Chrome extension, Gmail integration, and related services (collectively, the "Service").
          </p>
          <p>
            By using MailReply AI, you acknowledge the practices described in this Privacy Policy.
          </p>

          <h2 className="text-2xl mt-8 mb-4">1. Information We Access</h2>
          <p>MailReply AI only requests access to information necessary to provide the features you choose to use.</p>
          <h3 className="text-lg mt-6 mb-2">Gmail information</h3>
          <p>
            When you connect your Google account, MailReply AI may access Gmail information required to identify and understand the email conversation for which you request assistance.
            Depending on the permissions granted and the functionality enabled, this may include:
          </p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Email subject lines</li>
            <li>Email message content</li>
            <li>Sender and recipient information</li>
            <li>CC recipients</li>
            <li>Message dates and timestamps</li>
            <li>Gmail conversation/thread information</li>
            <li>Relevant message metadata</li>
            <li>Attachment names and metadata where necessary to identify conversation context</li>
            <li>Links contained within email messages where relevant to the requested reply</li>
          </ul>
          <p>
            MailReply AI does not access Gmail content simply for advertising, profiling, or unrelated analytics purposes. We request only the permissions necessary to provide the application's functionality. Google requires applications to request the minimum scopes necessary for their intended functionality.
          </p>

          <h2 className="text-2xl mt-8 mb-4">2. How We Use Gmail Data</h2>
          <p>MailReply AI uses Gmail data only to provide the email-assistance features requested by the user. For example, Gmail conversation data may be used to:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Read and understand the relevant email conversation</li>
            <li>Identify questions, requests, action items, and important context</li>
            <li>Generate an AI-assisted reply</li>
            <li>Apply the user's custom instructions</li>
            <li>Apply selected reply preferences such as tone, length, or language</li>
            <li>Place the generated reply into the Gmail reply composer when the user requests insertion</li>
            <li>Detect whether the conversation changed before inserting a generated response</li>
          </ul>
          <p>
            MailReply AI does not use Gmail data for unrelated advertising, selling user data, or building advertising profiles. Our use of Google user data is limited to the purposes disclosed in this Privacy Policy. Google requires applications using Google API data to accurately disclose how that data is accessed, used, stored, and shared.
          </p>

          <h2 className="text-2xl mt-8 mb-4">3. AI Processing</h2>
          <p>MailReply AI uses artificial intelligence to generate reply drafts. When you request an AI-generated reply, relevant conversation information and your instructions may be processed by the AI provider configured for the Service.</p>
          <p>The information used for generation may include:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Relevant Gmail message content</li>
            <li>Conversation context</li>
            <li>Your custom instructions</li>
            <li>Selected tone, length, and language preferences</li>
            <li>Other information required to produce the requested response</li>
          </ul>
          <p>The exact handling of this information depends on the AI provider selected in the Service.</p>

          <h3 className="text-lg mt-6 mb-2">Local AI</h3>
          <p>If you configure MailReply AI to use a locally running AI system, such as Ollama, the AI processing may occur on your own computer or local environment rather than being sent to a third-party hosted AI provider.</p>

          <h3 className="text-lg mt-6 mb-2">External AI providers</h3>
          <p>
            If you configure a cloud-based or third-party AI provider, the information required to generate the requested reply may be transmitted to that provider through the configuration you have selected. You are responsible for reviewing the privacy and data-processing practices of any third-party AI provider you choose. MailReply AI does not represent that all third-party AI providers follow the same retention, training, or privacy practices.
          </p>

          <h2 className="text-2xl mt-8 mb-4">4. User Instructions</h2>
          <p>MailReply AI allows you to provide custom instructions such as:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>"Make this shorter."</li>
            <li>"Reply professionally."</li>
            <li>"Apologize for the delay."</li>
            <li>"Ask for the missing information."</li>
            <li>"Make the response friendly but concise."</li>
          </ul>
          <p>
            These instructions are used to customize the generated reply. Custom instructions may be processed together with the relevant Gmail conversation to generate the requested response. Do not enter passwords, payment card information, authentication secrets, or other information that you do not want processed by the configured AI provider.
          </p>

          <h2 className="text-2xl mt-8 mb-4">5. Reply Drafts and Sending</h2>
          <p>MailReply AI is designed to generate and insert a draft reply into the Gmail composer. <strong>MailReply AI does not automatically send emails.</strong></p>
          <p>The user remains responsible for:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Reviewing the generated reply</li>
            <li>Editing the response</li>
            <li>Confirming the recipient</li>
            <li>Deciding whether to send the message</li>
            <li>Clicking Gmail's Send button</li>
          </ul>
          <p>A generated reply is an assistance feature and should be reviewed for accuracy before sending.</p>

          <h2 className="text-2xl mt-8 mb-4">6. What MailReply AI Does Not Do</h2>
          <p>Unless explicitly stated and enabled as part of a future feature, MailReply AI does not:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Automatically send emails</li>
            <li>Automatically reply to emails</li>
            <li>Sell Gmail information</li>
            <li>Use Gmail content for advertising</li>
            <li>Build advertising profiles from Gmail content</li>
            <li>Access unrelated Google services without authorization</li>
            <li>Read emails unrelated to the functionality requested by the user</li>
            <li>Use Gmail data to determine eligibility for credit, insurance, employment, housing, or other sensitive decisions</li>
          </ul>

          <h2 className="text-2xl mt-8 mb-4">7. Data Retention</h2>
          <p>MailReply AI follows a data-minimization approach. We do not intend to retain complete Gmail conversations longer than reasonably necessary to provide the requested functionality. Where technically possible, conversation data used to generate a reply should remain temporary and be discarded after processing.</p>
          <p>Application configuration and preferences, such as:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Selected AI provider</li>
            <li>Model name</li>
            <li>Reply preferences</li>
            <li>UI preferences</li>
            <li>Custom default instructions</li>
          </ul>
          <p>may be stored to provide the Service.</p>
          <p>Gmail conversation content, generated replies, and other sensitive content should not be retained permanently unless a specific feature requires such retention and the user has been appropriately informed. If our actual implementation stores any Gmail data, generated replies, logs, cached content, or AI prompts for longer periods, this Privacy Policy must be updated to accurately describe that retention. Google requires privacy disclosures to accurately match an application's actual handling of Google user data.</p>

          <h2 className="text-2xl mt-8 mb-4">8. Google Account Authentication</h2>
          <p>MailReply AI uses Google's OAuth authorization process to connect your Google account. We do not ask you to provide your Google password to MailReply AI. Google handles the authentication and authorization process.</p>
          <p>When you connect Gmail, Google presents the permissions requested by MailReply AI and allows you to approve or deny access. You may revoke MailReply AI's access to your Google Account through your Google Account settings.</p>

          <h2 className="text-2xl mt-8 mb-4">9. Google API Services User Data Policy</h2>
          <p>MailReply AI's use and transfer of information received from Google APIs complies with the applicable Google API Services User Data Policy, including the requirements relating to Limited Use.</p>
          <p>Google user data is used only to provide or improve features that are directly visible and meaningful to the user and as otherwise permitted by Google's applicable policies.</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>We do not sell Google user data.</li>
            <li>We do not use Google user data for advertising purposes.</li>
            <li>We do not use Google user data to develop or train generalized artificial intelligence or machine learning models unless such use is expressly permitted by applicable Google policies and clearly disclosed to the user.</li>
          </ul>
          <p>Google's policies require applications to limit their use of Google API data to the purposes disclosed in their privacy policy and impose additional requirements on applications requesting sensitive or restricted scopes.</p>

          <h2 className="text-2xl mt-8 mb-4">10. Data Sharing</h2>
          <p>MailReply AI may share or transmit information only when necessary to provide the requested Service. Depending on your configuration, information may be shared with:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li><strong>AI providers:</strong> Conversation information may be sent to the AI provider selected by you for the purpose of generating a reply.</li>
            <li><strong>Infrastructure and hosting providers:</strong> Service providers may process limited technical information necessary to host, secure, maintain, and operate MailReply AI.</li>
            <li><strong>Google:</strong> Google processes authentication and Gmail API requests according to Google's own privacy policies and terms.</li>
          </ul>
          <p>We do not sell your Gmail data or personal information to third parties. We do not permit third parties to use Gmail data for their own advertising purposes.</p>

          <h2 className="text-2xl mt-8 mb-4">11. Security</h2>
          <p>We take reasonable and appropriate measures to protect information against unauthorized access, disclosure, alteration, and destruction. Security measures may include:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>HTTPS/TLS encryption for data transmitted over networks</li>
            <li>Secure OAuth authentication</li>
            <li>Least-privilege Google API permissions</li>
            <li>Protection of application credentials and API keys</li>
            <li>Input validation</li>
            <li>Secure message passing between extension components</li>
            <li>Protection against common web security vulnerabilities</li>
            <li>Avoiding sensitive email content in application logs</li>
            <li>Temporary processing of email content where practical</li>
          </ul>
          <p>Google expects applications using Google API Services to maintain a secure operating environment and protect user data against unauthorized or unlawful access, destruction, loss, alteration, or disclosure. No internet-based system can be guaranteed to be completely secure.</p>

          <h2 className="text-2xl mt-8 mb-4">12. Chrome Extension Permissions</h2>
          <p>The MailReply AI Chrome extension may request permissions required for:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Connecting to Gmail</li>
            <li>Detecting the Gmail conversation currently being viewed</li>
            <li>Retrieving authorized Gmail conversation information</li>
            <li>Providing the AI reply assistant inside Gmail</li>
            <li>Inserting a user-approved reply draft into the Gmail composer</li>
          </ul>
          <p>We aim to request only the permissions necessary for the functionality provided. Google's OAuth policies require developers to use the smallest practical set of scopes needed to provide the requested features.</p>

          <h2 className="text-2xl mt-8 mb-4">13. Cookies and Local Storage</h2>
          <p>MailReply AI may use browser storage technologies such as local storage or Chrome extension storage to save application preferences and configuration. This may include:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>User preferences</li>
            <li>AI provider configuration</li>
            <li>UI settings</li>
            <li>Extension state</li>
            <li>Connection status</li>
          </ul>
          <p>Sensitive authentication credentials and OAuth tokens should be handled using appropriate platform security mechanisms rather than being stored as ordinary application data.</p>

          <h2 className="text-2xl mt-8 mb-4">14. Logs and Diagnostics</h2>
          <p>We may collect limited technical information necessary to diagnose errors, improve reliability, and maintain the Service. Examples may include:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Browser and extension version</li>
            <li>Application version</li>
            <li>Error type</li>
            <li>Performance information</li>
            <li>Technical diagnostic information</li>
          </ul>
          <p>We do not intentionally include full email bodies, Gmail message content, OAuth tokens, API keys, or generated replies in standard application logs.</p>

          <h2 className="text-2xl mt-8 mb-4">15. Your Rights and Choices</h2>
          <p>You may:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Choose whether to connect your Google account</li>
            <li>Decline Gmail permissions</li>
            <li>Disconnect Gmail from MailReply AI</li>
            <li>Revoke Google account access</li>
            <li>Stop using the Service</li>
            <li>Remove the browser extension</li>
            <li>Request deletion of personal information held by us where applicable</li>
            <li>Contact us regarding questions or concerns about your data</li>
          </ul>
          <p>Revoking Google authorization may prevent Gmail-related features from working until access is granted again.</p>

          <h2 className="text-2xl mt-8 mb-4">16. Data Deletion</h2>
          <p>You may request deletion of personal information associated with your use of MailReply AI. Where applicable, we will delete or anonymize personal information within a reasonable period, subject to:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Legal obligations</li>
            <li>Security requirements</li>
            <li>Fraud prevention</li>
            <li>Legitimate technical requirements</li>
            <li>Data that we are legally required to retain</li>
          </ul>
          <p>Google also provides mechanisms for users to manage and revoke access to connected applications. If MailReply AI stores Google user data on servers, the actual deletion process and retention periods must follow the application's implemented data-retention architecture and applicable Google requirements.</p>

          <h2 className="text-2xl mt-8 mb-4">17. Children's Privacy</h2>
          <p>MailReply AI is intended for business and general productivity use. The Service is not directed toward children under the minimum age required by applicable law. We do not knowingly collect personal information from children in violation of applicable privacy laws. If you believe that a child has provided personal information to us, please contact us so that we can investigate and take appropriate action.</p>

          <h2 className="text-2xl mt-8 mb-4">18. Third-Party Services</h2>
          <p>MailReply AI may integrate with third-party services such as:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Google Gmail API</li>
            <li>Google OAuth</li>
            <li>AI providers selected by the user</li>
            <li>Hosting and infrastructure providers</li>
            <li>Authentication or operational service providers</li>
          </ul>
          <p>Each third-party service may have its own terms and privacy policy. Users should review the privacy practices of third-party providers they choose to connect to MailReply AI.</p>

          <h2 className="text-2xl mt-8 mb-4">19. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Changes to the Service</li>
            <li>Changes to Gmail or Google API integrations</li>
            <li>Changes to AI providers</li>
            <li>Changes in legal or regulatory requirements</li>
            <li>Changes in data processing practices</li>
          </ul>
          <p>When material changes are made, we may provide an appropriate notice within the Service or by other reasonable means. The "Last Updated" date at the top of this Privacy Policy indicates when the policy was most recently revised. If we materially change how Google user data is used, we will update our disclosures and obtain any consent required before using that data for a new purpose. Google explicitly requires applications to update their disclosures when their use of Google user data changes.</p>

          <h2 className="text-2xl mt-8 mb-4">20. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, your data, or MailReply AI's privacy practices, contact us at:</p>
          <div className="bg-muted/30 p-4 rounded-lg mt-4 mb-8 text-sm">
            <p><strong>Company / Product:</strong> MailReply AI</p>
            <p><strong>Website:</strong> <a href="https://mailreplyai.vercel.app">https://mailreplyai.vercel.app</a></p>
            <p><strong>Privacy Email:</strong> <a href="mailto:anilkumar.apexweb.cube@gmail.com">anilkumar.apexweb.cube@gmail.com</a></p>
            <p><strong>Support Email:</strong> <a href="mailto:anilkumar.apexweb.cube@gmail.com">anilkumar.apexweb.cube@gmail.com</a></p>
            <p><strong>Address:</strong> Pratap Nagar jaipur, Rajasthan</p>
          </div>

          <h2 className="text-2xl mt-8 mb-4">21. Important Google OAuth Disclosure</h2>
          <p>MailReply AI uses Google OAuth and Google APIs to provide Gmail-related functionality. Google OAuth access is granted directly by the user through Google's authorization interface. MailReply AI does not receive or request the user's Google Account password.</p>
          <p>The Gmail permissions requested by MailReply AI are used only for the functionality described in this Privacy Policy. For production deployment, the application's Google OAuth configuration, requested scopes, privacy policy, homepage, and actual product behavior must remain consistent. Google requires production applications using relevant sensitive or restricted scopes to complete applicable verification before requesting those scopes from users.</p>
        </article>
      </main>
    </Shell>
  );
}
