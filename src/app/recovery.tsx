import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

interface RecoveryProps {
  onBack: () => void;
}

const Recovery: React.FC<RecoveryProps> = ({ onBack }) => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handlePasswordRecovery = async () => {
    setIsLoading(true);
    const requestBody = createRequestBody(email);

    try {
      const response = await sendRecoveryRequest(requestBody);
      if (response.ok) {
        showAlert('Sucesso', 'Seus dados de cadastro foram enviados para seu email.');
        onBack();
      } else {
        showAlert('Erro', 'Verifique se o email está correto.');
      }
    } catch (error) {
      console.error('Erro durante a recuperação de senha:', error);
      showAlert('Erro', 'Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const createRequestBody = (emailParam: string) => {
    return new URLSearchParams({ email: emailParam }).toString();
  };

  const sendRecoveryRequest = async (body: string) => {
    return await fetch('https://app.reaisystems.com.br/sistema/recuperarSenha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    });
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Esqueceu sua Senha?</Text>
      <Text style={styles.subtitle}>O sistema irá enviar um e-mail com seus dados de usuário.</Text>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Digite seu email"
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#bbb"
      />

      <TouchableOpacity style={styles.button} onPress={handlePasswordRecovery} disabled={isLoading}>
        {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Enviar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Voltar ao login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fa581a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#fa581a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fa581a',
  },
});

export default Recovery;
