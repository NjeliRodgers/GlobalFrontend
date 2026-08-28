import React, { useEffect, useState } from 'react';

function getCountdownParts(expiresAt: string) {
  const target = new Date(expiresAt).getTime();
  const diffMs = target - Date.now();
  if (diffMs <= 0) return null;
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

const formatDeadlineDate = (expiresAt: string) =>
  new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

interface JobExpiryCountdownProps {
  expiresAt: string;
  className?: string;
}

export const JobExpiryCountdown: React.FC<JobExpiryCountdownProps> = ({ expiresAt, className }) => {
  const [parts, setParts] = useState(() => getCountdownParts(expiresAt));

  useEffect(() => {
    setParts(getCountdownParts(expiresAt));
    const interval = setInterval(() => setParts(getCountdownParts(expiresAt)), 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!parts) {
    return <span className={className}>Application deadline passed</span>;
  }

  const { days, hours, minutes } = parts;
  const remainingLabel =
    days > 0 ? `${days}d ${hours}h remaining` : hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;

  return (
    <span className={className}>
      {remainingLabel} · Deadline: {formatDeadlineDate(expiresAt)}
    </span>
  );
};