import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { useAuth } from '../../../context/AuthContext'

const settings = () => {
  const { profile, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {profile ? (
        <Text style={styles.email}>Signed in as {profile.email}</Text>
      ) : null}
      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

export default settings

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  email: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 24,
  },
  signOutButton: {
    backgroundColor: '#cc3333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  signOutText: {
    color: '#ffffff',
    fontWeight: '600',
  },
})