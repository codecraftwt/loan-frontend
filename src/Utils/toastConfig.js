// src/utils/toastConfig.js
import React from 'react';
import { View, Text } from 'react-native';

// Define the toastConfig with proper ReactNode return type
export const toastConfig = {
    success: ({ text1, text2 }) => (
        <View style={{ padding: 15, backgroundColor: 'green', borderRadius: 10, width: 350, marginTop: 35 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{text1}</Text>
            {/* <Text style={{ color: 'lightgray' }}>{text2}</Text> */}
        </View>
    ),
    error: ({ text1, text2 }) => (
        <View style={{ padding: 15, backgroundColor: 'red', borderRadius: 10, width: 350, marginTop: 35 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{text1}</Text>
            {/* <Text style={{ color: 'lightgray' }}>{text2}</Text> */}
        </View>
    ),
    info: ({ text1, text2 }) => (
        <View style={{ padding: 15, backgroundColor: '#3842ff', borderRadius: 10, width: 350, marginTop: 35 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>{text1}</Text>
            {/* <Text style={{ color: 'lightgray' }}>{text2}</Text> */}
        </View>
    ),
    // Add more custom toast types here if necessary
};
