import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import JobPostForm from './JobPostForm';
import JobList from './JobList';

export default function Jobs() {
  const { user } = useAuth();

  if (!user) return <div>Please log in to view this page.</div>;

  if (user.role === 'company') {
    return <JobPostForm />;
  }

  if (user.role === 'developer') {
    return <JobList />;
  }

  return <div>Unauthorized</div>;
}