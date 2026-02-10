
import React from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (id: string) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(recipe.id)}
      className="w-full text-left bg-gradient-card border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98] group relative overflow-hidden"
    >
      {recipe.isPremium && (
        <div className="absolute top-0 right-0 p-2">
          <div className="bg-primary/10 text-primary p-1.5 rounded-bl-xl rounded-tr-lg">
            <i className="fa-solid fa-crown text-[10px]"></i>
          </div>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="text-4xl bg-surface w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-primary/20 transition-colors">
          {recipe.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{recipe.category}</span>
            <i className={`fa-solid ${recipe.isPremium ? 'fa-lock text-slate-600' : 'fa-arrow-right text-slate-500'} group-hover:text-primary transition-colors`}></i>
          </div>
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{recipe.name}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{recipe.description}</p>
        </div>
      </div>
    </button>
  );
};

export default RecipeCard;
