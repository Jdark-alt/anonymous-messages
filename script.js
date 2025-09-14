// Replace with YOUR Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCl6BdJL3vEJP1PHfxSbDWNll972p_qn4U",
  authDomain: "anonymous-messages-app-215dc.firebaseapp.com",
  projectId: "anonymous-messages-app-215dc",
  storageBucket: "anonymous-messages-app-215dc.firebasestorage.app",
  messagingSenderId: "369821019026",
  appId: "1:369821019026:web:350f0819d5390429246f4b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Create Profile functionality
if (document.getElementById('profileForm')) {
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('displayName').value;
        const passcode = document.getElementById('passcode').value;
        const createBtn = document.getElementById('createBtn');
        
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Profile...';
        createBtn.disabled = true;
        
        try {
            // Check if display name exists
            const existingProfiles = await db.collection('profiles').where('displayName', '==', displayName).get();
            
            if (!existingProfiles.empty) {
                alert('Display name already exists. Please choose another.');
                createBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Create My Profile';
                createBtn.disabled = false;
                return;
            }
            
            // Create profile
            const docRef = await db.collection('profiles').add({
                displayName: displayName,
                passcode: passcode,
                createdAt: new Date(),
                messageCount: 0
            });
            
            // Show success message with CORRECTED URLs
            const basePath = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
            const baseUrl = `${window.location.origin}${basePath}`;
            
            const profileUrl = `${baseUrl}/send.html?id=${docRef.id}`;
            const dashboardUrl = `${baseUrl}/dashboard.html?id=${docRef.id}`;
            
            document.getElementById('profileUrl').value = profileUrl;
            document.getElementById('dashboardLink').href = dashboardUrl;
            
            document.getElementById('createForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
            console.log('Profile created successfully!', docRef.id);
            
        } catch (error) {
            console.error('Error creating profile:', error);
            alert('Error creating profile: ' + error.message);
            createBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Create My Profile';
            createBtn.disabled = false;
        }
    });
}

// Quick Login functionality
if (document.getElementById('quickLoginForm')) {
    document.getElementById('quickLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const profileId = document.getElementById('existingProfileId').value.trim();
        const passcode = document.getElementById('existingPasscode').value;
        const loginBtn = document.getElementById('loginBtn');
        
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking...';
        loginBtn.disabled = true;
        
        try {
            const doc = await db.collection('profiles').doc(profileId).get();
            
            if (doc.exists && doc.data().passcode === passcode) {
                // Redirect to dashboard
                const basePath = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
                window.location.href = `${basePath}/dashboard.html?id=${profileId}`;
            } else {
                alert('Invalid Profile ID or passcode. Please check your details.');
            }
            
        } catch (error) {
            console.error('Error accessing profile:', error);
            alert('Error accessing profile: ' + error.message);
        }
        
        loginBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>Access My Dashboard';
        loginBtn.disabled = false;
    });
}

// Profile ID Finder functionality
function showProfileIdFinder() {
    document.getElementById('profileIdModal').style.display = 'flex';
}

function hideProfileIdFinder() {
    document.getElementById('profileIdModal').style.display = 'none';
    document.getElementById('foundProfile').style.display = 'none';
    document.getElementById('findProfileForm').reset();
}

if (document.getElementById('findProfileForm')) {
    document.getElementById('findProfileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('findDisplayName').value;
        const passcode = document.getElementById('findPasscode').value;
        
        try {
            const querySnapshot = await db.collection('profiles')
                .where('displayName', '==', displayName)
                .where('passcode', '==', passcode)
                .get();
            
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                document.getElementById('foundProfileId').value = doc.id;
                document.getElementById('foundProfile').style.display = 'block';
            } else {
                alert('No profile found with those credentials.');
            }
            
        } catch (error) {
            console.error('Error searching for profile:', error);
            alert('Error searching for profile.');
        }
    });
}

// Copy to clipboard function
function copyToClipboard() {
    const profileUrl = document.getElementById('profileUrl');
    profileUrl.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

// Load profile for sending message
async function loadProfileForSending(profileId) {
    try {
        console.log('Loading profile:', profileId);
        const doc = await db.collection('profiles').doc(profileId).get();
        
        if (doc.exists) {
            const profile = doc.data();
            console.log('Profile loaded:', profile);
            
            document.getElementById('profileName').textContent = profile.displayName;
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('messageSection').classList.remove('hidden');
            
            // Handle message form submission
            document.getElementById('messageForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const content = document.getElementById('messageContent').value;
                const sendBtn = document.getElementById('sendBtn');
                
                sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending Message...';
                sendBtn.disabled = true;
                
                try {
                    // Generate unique conversation ID
                    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    // Add message to Firestore
                    const docRef = await db.collection('messages').add({
                        profileId: profileId,
                        conversationId: conversationId,
                        content: content,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        isAnonymous: true,
                        responses: [],
                        senderCanReply: true
                    });
                    
                    console.log('Message sent successfully:', docRef.id);
                    
                    // Generate conversation link
                    const basePath = window.location.pathname.replace('send.html', '').replace(/\/$/, '');
                    const chatLink = `${window.location.origin}${basePath}/chat.html?conv=${conversationId}`;
                    
                    // Update UI
                    document.getElementById('chatLink').value = chatLink;
                    document.getElementById('conversationLink').href = chatLink;
                    
                    document.getElementById('messageSection').style.display = 'none';
                    document.getElementById('sentMessage').style.display = 'block';
                    
                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Error sending message: ' + error.message);
                    sendBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Anonymous Message';
                    sendBtn.disabled = false;
                }
            });
            
        } else {
            console.log('Profile not found');
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').classList
