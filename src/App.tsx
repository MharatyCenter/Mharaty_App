import { useState } from 'react';
import HomeScreen from './HomeScreen';
import CoursesScreen from './CoursesScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'courses'>('home');
  const [selectedCategory, setSelectedCategory] = useState<'digital' | 'professional' | 'life'>('digital');

  const handleViewCategory = (category: 'digital' | 'professional' | 'life') => {
    setSelectedCategory(category);
    setCurrentScreen('courses');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  if (currentScreen === 'courses') {
    return (
      <CoursesScreen 
        currentCategory={selectedCategory} 
        onBack={handleBackToHome} 
      />
    );
  }

  return (
    <HomeScreen 
      onNavigateToCategory={handleViewCategory} 
    />
  );
}