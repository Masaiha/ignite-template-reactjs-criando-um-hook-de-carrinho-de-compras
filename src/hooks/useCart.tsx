import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

    const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart]; // criando um novo array de carts

      // verificando se produto existe no carrinho
      const productExists = updateCart.find(product => product.id === productId);

      // buscando estoque do produto
      const stock = await api.get(`stock/${productId}`);
                 
      // verificando quantidade deste produto em específico dentro do estoque
      const stockAmount = stock.data?.amount;

      // se existe no carrinho, pega a quantidade atual
      const currentAmount = productExists ? productExists.amount : 0;

      // adiciona 1 valor na quantidade
      const amount = currentAmount + 1;

      // verificando se quantidade solicitada tem disponível no estoque
      if(amount > stockAmount){
            toast.error('Quantidade solicitada fora de estoque');
            return;
      }

      if(productExists){
        productExists.amount = amount;
      }else{
        const product = await api.get(`products/${productId}`);
        
        const newProduct = {
            ...product.data,
            amount: 1
        }

        updateCart.push(newProduct);
      }

      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {      
                const updatedCart = [...cart];
                const productIndex = updatedCart.findIndex(product => product.id === productId);

                if(productIndex < 0) throw Error();

                updatedCart.splice(productId, 1);
                setCart(updatedCart);
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
        toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({productId, amount}: UpdateProductAmount) => {
    try {
      if(amount <= 0) return;

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(amount >= stockAmount){
          toast.error('Quantidade solicitada fora de estoque');
          return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      if(productExists){
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      }else{
        throw Error();
      }

    } catch {
        toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
