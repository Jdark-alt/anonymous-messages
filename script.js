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
            
            // Add some celebration
            console.log('Profile created successfully!', docRef.id);
            
        } catch (error) {
            console.error('Error creating profile:', error);
            alert('Error creating profile. Please try again.');
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
            alert('Error accessing profile. Please check your Profile ID.');
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
    
    // Show a nice success message
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add('bg-green-500');
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('bg-green-500');
    }, 2000);
}

// Load profile for sending message - FIXED VERSION
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
                    
                    // Add message to Firestore - FIXED
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
            document.getElementById('errorMessage').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').classList.remove('hidden');
    }
}

// Copy chat link function
function copyChatLink() {
    const chatLink = document.getElementById('chatLink');
    chatLink.select();
    document.execCommand('copy');
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add('bg-green-500');
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('bg-green-500');
    }, 2000);
}

// Send another message function
function sendAnother() {
    document.getElementById('messageContent').value = '';
    document.getElementById('sentMessage').style.display = 'none';
    document.getElementById('messageSection').classList.remove('hidden');
    
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Anonymous Message';
    sendBtn.disabled = false;
}

// Dashboard functionality - UPDATED
async function initDashboard(profileId) {
    document.getElementById('authForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const passcode = document.getElementById('loginPasscode').value;
        const authBtn = document.getElementById('authBtn');
        
        authBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking...';
        authBtn.disabled = true;
        
        try {
            const doc = await db.collection('profiles').doc(profileId).get();
            
            if (doc.exists && doc.data().passcode === passcode) {
                const profile = doc.data();
                
                // Show dashboard
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('dashboardContent').style.display = 'block';
                document.getElementById('profileDisplayName').textContent = profile.displayName;
                
                // FIXED: Correct URL generation
                const basePath = window.location.pathname.replace('dashboard.html', '').replace(/\/$/, '');
                const shareUrl = `${window.location.origin}${basePath}/send.html?id=${profileId}`;
                document.getElementById('shareUrl').value = shareUrl;
                
                // Load messages with real-time updates
                loadMessages(profileId);
                
            } else {
                alert('Invalid passcode. Please try again.');
                authBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>Access Dashboard';
                authBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Error authenticating:', error);
            alert('Error accessing dashboard: ' + error.message);
            authBtn.innerHTML = '<i class="fas fa-unlock mr-2"></i>Access Dashboard';
            authBtn.disabled = false;
        }
    });
}

// Load messages for dashboard - IMPROVED
function loadMessages(profileId) {
    console.log('Loading messages for profile:', profileId);
    
    // Real-time listener for messages
    db.collection('messages')
        .where('profileId', '==', profileId)
        .orderBy('timestamp', 'desc')
        .onSnapshot(function(querySnapshot) {
            const messages = [];
            querySnapshot.forEach(function(doc) {
                const data = doc.data();
                messages.push({ 
                    id: doc.id, 
                    ...data,
                    timestamp: data.timestamp || new Date() // Fallback for timestamp
                });
            });
            
            console.log('Messages loaded:', messages.length);
            document.getElementById('messageCount').textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;
            
            if (messages.length === 0) {
                document.getElementById('messagesContainer').innerHTML = `
                    <div class="text-center py-16 bg-white rounded-2xl shadow-lg">
                        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-inbox text-3xl text-blue-500"></i>
                        </div>
                        <h3 class="text-xl font-medium text-gray-600 mb-2">No messages yet</h3>
                        <p class="text-gray-500">Share your profile link to start receiving anonymous messages!</p>
                    </div>
                `;
            } else {
                displayMessages(messages);
            }
        }, function(error) {
            console.error('Error loading messages:', error);
        });
}

// Display messages - ENHANCED
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white rounded-2xl shadow-lg p-6 mb-6 card-hover';
        messageDiv.style.animationDelay = `${index * 0.1}s`;
        
        const basePath = window.location.pathname.replace('dashboard.html', '').replace(/\/$/, '');
        const chatLink = message.conversationId ? 
            `${window.location.origin}${basePath}/chat.html?conv=${message.conversationId}` : 
            null;
        
        messageDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-user-secret text-white"></i>
                    </div>
                    <div>
                        <span class="font-semibold text-gray-800">Anonymous User</span>
                        <div class="text-sm text-gray-500">
                            ${message.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    ${chatLink ? `
                        <a href="${chatLink}" class="inline-flex items-center text-sm text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                            <i class="fas fa-external-link-alt mr-1"></i>
                            Full Chat
                        </a>
                    ` : ''}
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-xl mb-4">
                <p class="text-gray-800 text-lg leading-relaxed">${message.content}</p>
            </div>
            
            ${message.responses && message.responses.length > 0 ? `
                <div class="bg-blue-50 rounded-xl p-4 mb-4 border-l-4 border-blue-400">
                    <h4 class="text-sm font-semibold mb-3 text-blue-800 flex items-center">
                        <i class="fas fa-comments mr-2"></i>
                        Conversation (${message.responses.length} ${message.responses.length === 1 ? 'reply' : 'replies'})
                    </h4>
                    <div class="space-y-3 max-h-40 overflow-y-auto">
                        ${message.responses.slice(-3).map(response => `
                            <div class="${response.isOwner ? 'bg-green-100 border-l-4 border-green-400' : 'bg-white border-l-4 border-gray-300'} p-3 rounded">
                                <div class="flex justify-between text-xs text-gray-600 mb-1">
                                    <span class="font-medium">${response.isOwner ? 'You' : 'Anonymous'}</span>
                                    <span>${response.timestamp?.toDate?.()?.toLocaleString()}</span>
                                </div>
                                <p class="text-gray-800">${response.content}</p>
                            </div>
                        `).join('')}
                    </div>
                    ${message.responses.length > 3 ? `
                        <div class="text-center mt-3">
                            <a href="${chatLink}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                View all ${message.responses.length} replies →
                            </a>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div id="reply-${message.id}" class="hidden bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <div class="flex items-center mb-3">
                    <i class="fas fa-reply mr-2 text-blue-600"></i>
                    <span class="font-semibold text-blue-800">Reply to this message</span>
                </div>
                <textarea id="replyText-${message.id}" placeholder="Write your reply..." class="w-full p-3 border-2 border-blue-200 rounded-lg mb-3 h-24 resize-none focus:border-blue-500 transition-all outline-none"></textarea>
                <div class="flex gap-2">
                    <button onclick="sendReply('${message.id}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all">
                        <i class="fas fa-send mr-1"></i>Send Reply
                    </button>
                    <button onclick="cancelReply('${message.id}')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all">
                        Cancel
                    </button>
                </div>
            </div>
            
            <button onclick="showReply('${message.id}')" id="replyBtn-${message.id}" class="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-all">
                <i class="fas fa-reply mr-2"></i>Reply to this message
            </button>
        `;
        
        container.appendChild(messageDiv);
    });
}

// Reply functions - ENHANCED
function showReply(messageId) {
    document.getElementById(`reply-${messageId}`).classList.remove('hidden');
    document.getElementById(`replyBtn-${messageId}`).style.display = 'none';
    document.getElementById(`replyText-${messageId}`).focus();
}

function cancelReply(messageId) {
    document.getElementById(`reply-${messageId}`).classList.add('hidden');
    document.getElementById(`replyBtn-${messageId}`).style.display = 'block';
    document.getElementById(`replyText-${messageId}`).value = '';
}

async function sendReply(messageId) {
    const replyText = document.getElementById(`replyText-${messageId}`).value.trim();
    if (!replyText) return;
    
    try {
        const messageRef = db.collection('messages').doc(message
