'use client'

import { Carrot, Apple, Wheat, Bean, Flame, Milk, Leaf, Sprout } from 'lucide-react'
import { useCategories } from '@/lib/category-context'
import { cn } from '@/lib/utils'

const iconMap = {
  Carrot: <Carrot className="h-6 w-6" />,
  Apple: <Apple className="h-6 w-6" />,
  Wheat: <Wheat className="h-6 w-6" />,
  Bean: <Bean className="h-6 w-6" />,
  Flame: <Flame className="h-6 w-6" />,
  Milk: <Milk className="h-6 w-6" />,
  Leaf: <Leaf className="h-6 w-6" />,
  Sprout: <Sprout className="h-6 w-6" />,
}

const colorClasses = [
  'bg-green-100 text-green-700',
  'bg-red-100 text-red-700',
  'bg-amber-100 text-amber-700',
  'bg-orange-100 text-orange-700',
  'bg-rose-100 text-rose-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-lime-100 text-lime-700',
]

export function CategoryGrid({ onSelect, selectedId }) {
  const { categories, loading } = useCategories()
  
  if (loading) return (
    <div className="py-6">
      <div className="h-6 w-32 bg-slate-100 animate-pulse rounded mb-4" />
      <div className="grid grid-cols-4 gap-2.5 min-[375px]:grid-cols-5 min-[425px]:grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )

  const activeCategories = categories.filter(c => c.isActive !== false)

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Shop by Category</h2>
        {selectedId && (
          <button 
            onClick={() => onSelect(null)}
            className="text-xs font-bold text-primary hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2.5 min-[375px]:grid-cols-5 min-[425px]:grid-cols-6 sm:grid-cols-7 md:grid-cols-8 lg:gap-4">
        {activeCategories.map((category, index) => {
          const isActive = selectedId === category.id
          return (
            <button
              key={category.id}
              onClick={() => onSelect(isActive ? null : category.id)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl p-3 transition-all",
                isActive ? "bg-primary/10 ring-2 ring-primary/20" : "hover:bg-accent"
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110',
                  isActive ? "bg-primary text-white" : colorClasses[index % colorClasses.length]
                )}
              >
                {iconMap[category.icon] || <Leaf className="h-6 w-6" />}
              </div>
              <span className={cn(
                "text-center text-[10px] sm:text-xs font-bold tracking-tight",
                isActive ? "text-primary" : "text-foreground"
              )}>
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
