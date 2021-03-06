import React, { useState } from 'react';
import { 
    Keyboard, 
    Modal, 
    TouchableWithoutFeedback, 
    Alert 
} from 'react-native';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

import { useNavigation } from '@react-navigation/native'
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/auth';

import { CategorySelect } from '../CategorySelect';
import { Button } from '../../Components/Forms/Button';
import { InputForm } from '../../Components/Forms/InputForm'
import { CategorySelectButton } from '../../Components/Forms/CategorySelectButton';
import { TransactionTypeButton } from '../../Components/Forms/TransactionTypeButton';

import { 
  Container,
  Header,
  Title,
  Form,
  Fields,
  TransactionTypes
} from './styles';

interface FormData {
    name: string;
    amount: string;
}

type NavigationProps = {
    navigate:(screen:string) => void;
 }

const schema = Yup.object().shape({
    name: Yup
    .string()
    .required('O nome é obrigatório'),
    amount: Yup
    .number()
    .typeError('Informe um valor númerico')
    .positive('O preço não pode ser negativo')
    .required('O preço é obrigatório')
});

export function Register() {
    const [transactionType, setTransactionType] = useState('');
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    const { user } = useAuth();

    const [category, setCategory] = useState({
        key: 'category',
        name: 'categoria'
    });

    const navigation = useNavigation<NavigationProps>();

    const { 
        control,
        handleSubmit,
        reset,
        formState: { errors } 
    } = useForm({
        resolver: yupResolver(schema)
    });

    function handleTransactionTypeSelect(type: 'up' | 'down') {
        setTransactionType(type);
    }

    function handleOpenModalCategory() {
        setCategoryModalOpen(true);
    }

    function handleCloseModalCategory() {
        setCategoryModalOpen(false);
    }

    async function handleRegister(form: FormData) {

        if(!transactionType)
            return Alert.alert('Selecione o tipo da transação');

        if(category.key === 'category')
            return Alert.alert('Selecione a categoria');
        
        
        
        const newTransaction = {
            id: String(uuid.v4()),
            name: form.name,
            amount: form.amount,
            type: transactionType,
            category: category.key,
            date: new Date()
        }
        
        try {
            const dataKey = `@gofinances:transactions_user:${user.id}`;

            const dataStorage = await AsyncStorage.getItem(dataKey);
            const currentData = dataStorage ? JSON.parse(dataStorage): [];

            const dataFormatted = [
                ...currentData,
                newTransaction
            ];

            await AsyncStorage.setItem(dataKey, JSON.stringify(dataFormatted));

            reset();
            setTransactionType('');
            setCategory({
                key: 'category',
                name: 'categoria'
            });

            navigation.navigate('Listagem');

        } catch (error) {
            console.log(error);
            Alert.alert("Não foi possível salvar");
        }
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Container>
                <Header>
                    <Title>Cadastro</Title>
                </Header>

                <Form>
                    <Fields>
                        <InputForm 
                            name="name"
                            control={control}
                            placeholder="Nome"
                            autoCapitalize="sentences"
                            autoCorrect={false}
                            error={errors.name && errors.name.message}
                        />
                        <InputForm 
                            name="amount"
                            control={control}
                            placeholder="Preço"
                            keyboardType="numeric"
                            error={errors.amount && errors.amount.message}
                        />

                        <TransactionTypes>
                            <TransactionTypeButton 
                                type="up"
                                title="Income"
                                onPress={() => handleTransactionTypeSelect('up')}
                                isActive={transactionType === 'up'}
                            />
                            <TransactionTypeButton 
                                type="down"
                                title="Outcome"
                                onPress={() => handleTransactionTypeSelect('down')}
                                isActive={transactionType === 'down'}
                            />
                        </TransactionTypes>
                        
                        <CategorySelectButton 
                            title={category.name}
                            onPress={handleOpenModalCategory}
                        />
                    </Fields>

                    <Button 
                        title="Enviar"
                        onPress={handleSubmit(handleRegister)}
                    />
                </Form>

                <Modal visible={categoryModalOpen}>
                    <CategorySelect 
                        category={category}
                        setCategory={setCategory}
                        closeSelectCategory={handleCloseModalCategory}
                    />
                </Modal>
            </Container>
        </TouchableWithoutFeedback>
    )
}