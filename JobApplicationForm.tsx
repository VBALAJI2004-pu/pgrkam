import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Upload } from 'lucide-react';
import { AuthContext } from '../App'; // Import AuthContext

interface JobApplicationFormProps {
  jobTitle: string;
  jobId: string; // Add jobId to props
  onApplicationSubmit: (success: boolean) => void; // Modify to indicate success
}

export const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ jobTitle, jobId, onApplicationSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null); // State for the resume file
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null); // State for the cover letter file
  const { token, user } = useContext(AuthContext)!; // Get token and user from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!token || !user) {
      alert('Please login to submit an application.');
      navigate('/login');
      return;
    }
    
    // Basic validation
    if (!name || !email || !phone) {
      alert('Please fill in all required fields (Name, Email, Phone).');
      return;
    }

    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('jobTitle', jobTitle);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    if (resumeFile) {
      formData.append('resumeFile', resumeFile);
    }
    if (coverLetterFile) {
      formData.append('coverLetterFile', coverLetterFile);
    }

    try {
      console.log('Submitting application with token:', token ? 'Token present' : 'No token');
      const response = await fetch('http://localhost:5000/api/jobs/apply', {
        method: 'POST',
        headers: {
          'x-auth-token': token, // Include the token in the header (token is guaranteed to exist due to check above)
        },
        body: formData, // FormData automatically sets Content-Type to multipart/form-data
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert(`Application failed: Server returned an error. Please check if you are logged in and try again.`);
        onApplicationSubmit(false);
        return;
      }

      if (response.ok) {
        console.log('Application successful:', data);
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setResumeFile(null);
        setCoverLetterFile(null);
        // Call callback to show thank you message in chatbot
        onApplicationSubmit(true);
        navigate('/my-applications'); // Redirect to My Applications page after successful submission
      } else {
        alert(`Application failed: ${data.msg || data.error || 'Unknown error'}`);
        console.error('Application failed:', data);
        onApplicationSubmit(false); // Indicate failure
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('An error occurred while submitting your application. Please try again.');
      onApplicationSubmit(false); // Indicate failure
    }
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleCoverLetterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverLetterFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-background rounded-lg shadow-md overflow-y-auto max-h-[calc(100vh-200px)]"> {/* Added overflow-y-auto and max-h */}
      <h4 className="text-lg font-bold">Apply for {jobTitle}</h4>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="resume-upload" className="flex items-center space-x-2 cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md">
          <Upload className="h-4 w-4" />
          <span>{resumeFile ? resumeFile.name : 'Upload Resume (PDF, DOCX)'}</span>
        </Label>
        <Input 
          id="resume-upload" 
          type="file" 
          accept=".pdf,.doc,.docx" 
          onChange={handleResumeFileChange} 
          className="hidden" // Hide the default file input
        />
      </div>
      <div>
        <Label htmlFor="coverLetter-upload" className="flex items-center space-x-2 cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md">
          <Upload className="h-4 w-4" />
          <span>{coverLetterFile ? coverLetterFile.name : 'Upload Cover Letter (Optional - PDF, DOCX)'}</span>
        </Label>
        <Input 
          id="coverLetter-upload" 
          type="file" 
          accept=".pdf,.doc,.docx" 
          onChange={handleCoverLetterFileChange} 
          className="hidden" // Hide the default file input
        />
      </div>
      <Button type="submit" className="w-full">Submit Application</Button>
    </form>
  );
};
