import React, { useEffect, useState } from 'react';
import { Phone, Mail, Clock, Send } from 'lucide-react';
import { fetchJobs } from '../api/jobsApi';
import { Job } from '../types';
import { useSiteContent } from '../content/useSiteContent';
import { ThemedCard, PILLAR_THEMES, themeAt } from '../components/public/PublicBlocks';

export const ContactUsPage: React.FC = () => {
  const { content } = useSiteContent();
  const contact = content.contact;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [jobId, setJobId] = useState('');
  const [message, setMessage] = useState('');
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    fetchJobs({ status: 'active' }).then((jobs) => {
      setOpenJobs(jobs);
      setJobsLoading(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedJob = openJobs.find((j) => j.id === jobId);

    const lines = [
      `*New Contact Message*`,
      `Name: ${firstName} ${lastName}`.trim(),
      email && `Email: ${email}`,
      phone && `Phone: ${phone}`,
      subject && `Subject: ${subject}`,
      selectedJob && `Regarding Position: ${selectedJob.title}`,
      '',
      message
    ].filter(Boolean);

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${contact.whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* Hero */}
      <section className="text-white" style={{ backgroundImage: 'linear-gradient(135deg, #1f4e79 0%, #102a43 100%)' }}>
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{contact.hero.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
            {contact.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Get in Touch */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Get in Touch</h2>
            <p className="mt-2 text-slate-500">Choose the best way to reach us</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <ThemedCard theme={themeAt(PILLAR_THEMES, 0)} className="p-6 text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${themeAt(PILLAR_THEMES, 0).icon}`}>
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Phone</h3>
              {contact.phone.map((line, i) => (
                <p key={i} className="mt-1 text-sm text-slate-700">{line}</p>
              ))}
            </ThemedCard>

            <ThemedCard theme={themeAt(PILLAR_THEMES, 1)} className="p-6 text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${themeAt(PILLAR_THEMES, 1).icon}`}>
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Email</h3>
              {contact.email.map((line, i) => (
                <p key={i} className="mt-1 text-sm text-slate-700">{line}</p>
              ))}
            </ThemedCard>

            <ThemedCard theme={themeAt(PILLAR_THEMES, 2)} className="p-6 text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${themeAt(PILLAR_THEMES, 2).icon}`}>
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Working Hours</h3>
              {contact.hours.map((line, i) => (
                <p key={i} className="mt-1 text-sm text-slate-700">{line}</p>
              ))}
            </ThemedCard>
          </div>
        </div>
      </section>

      {/* Send us a Message */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900">{contact.form.heading}</h2>
            <p className="mt-2 text-slate-500">{contact.form.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Open Position</label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
              >
                <option value="">
                  {jobsLoading ? 'Loading open positions...' : 'Select a position (optional)'}
                </option>
                {openJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Tell us more about your inquiry..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1f4e79]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#1f4e79] hover:bg-[#102a43] text-white font-semibold text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};