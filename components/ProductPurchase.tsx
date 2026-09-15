'use client';

import { useState } from 'react';
import AddToCartButton from '@/components/AddToCartButton';

interface ProductVariant {
  id: string;
  price: { amount: string };
  availableForSale: boolean;
  quantityAvailable?: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface ProductPurchaseProps {
  title: string;
  handle: string;
  image?: string;
  variants: ProductVariant[];
}

export default function ProductPurchase({ title, handle, image, variants }: ProductPurchaseProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    Object.fromEntries((variants[0]?.selectedOptions || []).map((option) => [option.name, option.value])),
  );
  const optionGroups = variants.reduce<Array<{ name: string; values: string[] }>>((groups, variant) => {
    variant.selectedOptions.forEach((option) => {
      const group = groups.find((item) => item.name === option.name);
      if (group && !group.values.includes(option.value)) group.values.push(option.value);
      if (!group) groups.push({ name: option.name, values: [option.value] });
    });
    return groups;
  }, []);

  const selectedVariant = variants.find((variant) =>
    variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value),
  ) || variants[0];

  if (!selectedVariant) {
    return <p className="text-red-600">This product has no available variants.</p>;
  }

  const price = Number(selectedVariant.price.amount);
  const inStock = selectedVariant.availableForSale;

  return (
    <div>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-3xl font-bold text-zinc-900">${price.toFixed(2)}</span>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
          inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-600' : 'bg-red-600'}`} />
          {inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      {optionGroups.map((group) => (
        <fieldset key={group.name} className="mt-6">
          <legend className="text-sm font-semibold text-zinc-700">{group.name}</legend>
          <div className="flex flex-wrap gap-2 mt-2">
            {group.values.map((value) => {
              const nextOptions = { ...selectedOptions, [group.name]: value };
              const matchingVariant = variants.find((variant) =>
                variant.selectedOptions.every((option) => nextOptions[option.name] === option.value),
              );
              const isSelected = selectedOptions[group.name] === value;

              return (
                <button
                  key={`${group.name}-${value}`}
                  type="button"
                  onClick={() => matchingVariant && setSelectedOptions(nextOptions)}
                  disabled={!matchingVariant}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    isSelected ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 text-zinc-700 hover:border-zinc-500'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="mt-8">
        <AddToCartButton
          variantId={selectedVariant.id}
          title={title}
          handle={handle}
          price={price}
          image={image}
          available={inStock}
          maxQuantity={selectedVariant.quantityAvailable}
          selectedOptions={selectedVariant.selectedOptions}
        />
      </div>
    </div>
  );
}