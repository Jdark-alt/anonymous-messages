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
        
        createBtn.textContent = 'Creating...';
        createBtn.disabled = true;
        
        try {
            // Check if display name exists
            const existingProfiles = await db.collection('profiles').where('displayName', '==', displayName).get();
            
            if (!existingProfiles.empty) {
                alert('Display name already exists. Please choose another.');
                createBtn.textContent = 'Create Profile';
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
            
            // Show success message
            const profileUrl = `${window.location.origin}/send.html?id=${docRef.id}`;
            document.getElementById('profileUrl').value = profileUrl;
            document.getElementById('dashboardLink').href = `dashboard.html?id=${docRef.id}`;
            
            document.getElementById('createForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error creating profile. Please try again.');
            createBtn.textContent = 'Create Profile';
            createBtn.disabled = false;
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
        const doc = await db.collection('profiles').doc(profileId).get();
        
        if (doc.exists) {
            const profile = doc.data();
            document.getElementById('profileName').textContent = profile.displayName;
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('profileInfo').style.display = 'block';
            document.getElementById('messageForm').style.display = 'block';
            
            // Handle message form
            document.getElementById('messageForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const content = document.getElementById('messageContent').value;
                const sendBtn = document.getElementById('sendBtn');
                
                sendBtn.textContent = 'Sending...';
                sendBtn.disabled = true;
                
                try {
                    await db.collection('messages').add({
                        profileId: profileId,
                        content: content,
                        timestamp: new Date(),
                        isAnonymous: true,
                        responses: []
                    });
                    
                    document.getElementById('messageForm').style.display = 'none';
                    document.getElementById('sentMessage').style.display = 'block';
                    
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error sending message. Please try again.');
                    sendBtn.textContent = 'Send Anonymous Message';
                    sendBtn.disabled = false;
                }
            });
            
        } else {
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Send another message function
function sendAnother() {
    document.getElementById('messageContent').value = '';
    document.getElementById('sentMessage').style.display = 'none';
    document.getElementById('messageForm').style.display = 'block';
    document.getElementById('sendBtn').textContent = 'Send Anonymous Message';
    document.getElementById('sendBtn').disabled = false;
}

// Dashboard functionality
async function initDashboard(profileId) {
    document.getElementById('authForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const passcode = document.getElementById('loginPasscode').value;
        const authBtn = document.getElementById('authBtn');
        
        authBtn.textContent = 'Checking...';
        authBtn.disabled = true;
        
        try {
            const doc = await db.collection('profiles').doc(profileId).get();
            
            if (doc.exists && doc.data().passcode === passcode) {
                const profile = doc.data();
                
                // Show dashboard
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('dashboardContent').style.display = 'block';
                document.getElementById('profileDisplayName').textContent = profile.displayName;
                document.getElementById('shareUrl').value = `${window.location.origin}/send.html?id=${profileId}`;
                
                // Load messages
                loadMessages(profileId);
                
            } else {
                alert('Invalid passcode. Please try again.');
                authBtn.textContent = 'Access Dashboard';
                authBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error accessing dashboard. Please try again.');
            authBtn.textContent = 'Access Dashboard';
            authBtn.disabled = false;
        }
    });
}

// Load messages for dashboard
function loadMessages(profileId) {
    db.collection('messages')
        .where('profileId', '==', profileId)
        .orderBy('timestamp', 'desc')
        .onSnapshot(function(querySnapshot) {
            const messages = [];
            querySnapshot.forEach(function(doc) {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            document.getElementById('messageCount').textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;
            
            if (messages.length === 0) {
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="text-center py-16 bg-white rounded-lg shadow-md">
                        <div class="text-gray-400 text-6xl mb-4">📭</div>
                        <h3 class="text-xl font-medium text-gray-600 mb-2">No messages yet</h3>
                        <p class="text-gray-500">Share your profile link to start receiving anonymous messages!</p>
                    </div>
                `;
            } else {
                displayMessages(messages);
            }
        });
}

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        
        messageDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span class="text-white text-sm">?</span>
                    </div>
                    <span class="font-medium text-gray-600">Anonymous User</span>
                </div>
                <span class="text-xs text-gray-400">${message.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}</span>
            </div>
            
            <p class="text-gray-800 mb-4 text-lg">${message.content}</p>
            
            ${message.responses && message.responses.length > 0 ? `
                <div class="bg-gray-50 rounded-md p-4 mb-4">
                    <h4 class="text-sm font-semibold mb-3 text-gray-700">Conversation:</h4>
                    <div class="space-y-3">
                        ${message.responses.map(response => `
                            <div class="${response.isOwner ? 'bg-blue-100 border-l-4 border-blue-400' : 'bg-white border-l-4 border-gray-300'} p-3 rounded-md">
                                <div class="flex justify-between text-xs text-gray-500 mb-1">
                                    <span class="font-medium">${response.isOwner ? 'You' : 'Anonymous'}</span>
                                    <span>${response.timestamp?.toDate?.()?.toLocaleString()}</span>
                                </div>
                                <p class="text-gray-800">${response.content}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div id="reply-${message.id}" class="hidden bg-blue-50 p-4 rounded-md">
                <textarea id="replyText-${message.id}" placeholder="Write your reply..." class="w-full p-3 border border-gray-300 rounded-md mb-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                <div class="flex gap-2">
                    <button onclick="sendReply('${message.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Send Reply</button>
                    <button onclick="cancelReply('${message.id}')" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">Cancel</button>
                </div>
            </div>
            
            <button onclick="showReply('${message.id}')" id="replyBtn-${message.id}" class="text-blue-500 hover:text-blue-700 font-medium">💬 Reply to this message</button>
        `;
        
        container.appendChild(messageDiv);
    });
}

// Reply functions
function showReply(messageId) {
    document.getElementById(`reply-${messageId}`).style.display = 'block';
    document.getElementById(`replyBtn-${messageId}`).style.display = 'none';
}

function cancelReply(messageId) {
    document.getElementById(`reply-${messageId}`).style.display = 'none';
    document.getElementById(`replyBtn-${messageId}`).style.display = 'block';
    document.getElementById(`replyText-${messageId}`).value = '';
}

async function sendReply(messageId) {
    const replyText = document.getElementById(`replyText-${messageId}`).value;
    if (!replyText.trim()) return;
    
    try {
        const messageRef = db.collection('messages').doc(messageId);
        const messageDoc = await messageRef.get();
        const currentMessage = messageDoc.data();
        
        await messageRef.update({
            responses: [...(currentMessage.responses || []), {
                content: replyText,
                timestamp: new Date(),
                isOwner: true
            }]
        });
        
        cancelReply(messageId);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error sending reply. Please try again.');
    }
}

// Copy share URL
function copyShareUrl() {
    const shareUrl = document.getElementById('shareUrl');
    shareUrl.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

// Search functionality
if (document.getElementById('searchForm')) {
    document.getElementById('searchForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const searchTerm = document.getElementById('searchTerm').value;
        const searchBtn = document.getElementById('searchBtn');
        
        searchBtn.textContent = 'Searching...';
        searchBtn.disabled = true;
        
        try {
            const querySnapshot = await db.collection('profiles')
                .where('displayName', '>=', searchTerm)
                .where('displayName', '<=', searchTerm + '\uf8ff')
                .get();
            
            const results = [];
            querySnapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            
            displaySearchResults(results, searchTerm);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error searching profiles. Please try again.');
        }
        
        searchBtn.textContent = 'Search';
        searchBtn.disabled = false;
    });
}

function displaySearchResults(results, searchTerm) {
    const container = document.getElementById('searchResults');
    const noResults = document.getElementById('noResults');
    
    if (results.length === 0) {
        container.innerHTML = '';
        noResults.querySelector('p').innerHTML = `No profiles matching "<strong>${searchTerm}</strong>" were found.`;
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        container.innerHTML = results.map(profile => `
            <div class="bg-white rounded-lg shadow-md p-6 flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${profile.displayName}</h3>
                    <div class="flex items-center text-sm text-gray-500 space-x-4">
                        <span>📅 Created ${profile.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                        <span>💬 Profile ID: ${profile.id.slice(0, 8)}...</span>
                    </div>
                </div>
                <a href="send.html?id=${profile.id}" class="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 font-medium">
                    Send Message →
                </a>
            </div>
        `).join('');
    }
}
