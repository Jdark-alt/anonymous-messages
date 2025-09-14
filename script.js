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
    alert('Conversation link copied! Bookmark this to check for replies.');
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

// Dashboard functionality
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
                
                // Correct URL generation
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

// Load messages for dashboard
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
                    timestamp: data.timestamp || new Date()
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

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';
    
    messages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white rounded-2xl shadow-lg p-6 mb-6';
        
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
                    <div class="space-y-3">
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

// Reply functions
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

// COMPLETED sendReply function
async function sendReply(messageId) {
    const replyText = document.getElementById(`replyText-${messageId}`).value.trim();
    if (!replyText) return;
    
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
        console.error('Error sending reply:', error);
        alert('Error sending reply: ' + error.message);
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
            console.error('Error searching profiles:', error);
            alert('Error searching profiles: ' + error.message);
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
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        
        const basePath = window.location.pathname.replace('search.html', '').replace(/\/$/, '');
        
        container.innerHTML = results.map(profile => `
            <div class="bg-white rounded-lg shadow-md p-6 flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${profile.displayName}</h3>
                    <div class="flex items-center text-sm text-gray-500 space-x-4">
                        <span>📅 Created ${profile.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                        <span>💬 Profile ID: ${profile.id.slice(0, 8)}...</span>
                    </div>
                </div>
                <a href="${window.location.origin}${basePath}/send.html?id=${profile.id}" class="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 font-medium">
                    Send Message →
                </a>
            </div>
        `).join('');
    }
}

// Chat functionality
async function initChat(conversationId) {
    try {
        const querySnapshot = await db.collection('messages').where('conversationId', '==', conversationId).get();
        
        if (querySnapshot.empty) {
            document.getElementById('chatContainer').innerHTML = `
                <div class="text-center py-16">
                    <div class="text-red-500 text-6xl mb-4">❌</div>
                    <h3 class="text-xl font-medium text-gray-600 mb-2">Conversation not found</h3>
                    <p class="text-gray-500">The conversation link may be invalid or expired.</p>
                </div>
            `;
            return;
        }
        
        let messageData = null;
        querySnapshot.forEach(doc => {
            messageData = { id: doc.id, ...doc.data() };
        });
        
        if (messageData) {
            displayChatConversation(messageData);
            
            // Listen for real-time updates
            db.collection('messages').doc(messageData.id).onSnapshot(doc => {
                if (doc.exists) {
                    displayChatConversation({ id: doc.id, ...doc.data() });
                }
            });
        }
        
    } catch (error) {
        console.error('Error loading chat:', error);
        document.getElementById('chatContainer').innerHTML = `
            <div class="text-center py-16">
                <div class="text-red-500 text-6xl mb-4">❌</div>
                <h3 class="text-xl font-medium text-gray-600 mb-2">Error loading conversation</h3>
                <p class="text-gray-500">Please try again later.</p>
            </div>
        `;
    }
}

function displayChatConversation(messageData) {
    const container = document.getElementById('chatContainer');
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800">Anonymous Conversation</h2>
                <span class="text-sm text-gray-500">
                    Started ${messageData.timestamp?.toDate?.()?.toLocaleDateString()}
                </span>
            </div>
            
            <div class="space-y-4">
                <!-- Original Message -->
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-medium text-blue-700">Anonymous Sender</span>
                        <span class="text-xs text-blue-600">${messageData.timestamp?.toDate?.()?.toLocaleString()}</span>
                    </div>
                    <p class="text-gray-800">${messageData.content}</p>
                </div>
                
                <!-- Responses -->
                <div id="chatResponses" class="space-y-3">
                    ${messageData.responses ? messageData.responses.map(response => `
                        <div class="${response.isOwner ? 'bg-green-50 border-l-4 border-green-400' : 'bg-gray-50 border-l-4 border-gray-400'} p-4 rounded">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-medium ${response.isOwner ? 'text-green-700' : 'text-gray-700'}">
                                    ${response.isOwner ? 'Profile Owner' : 'Anonymous Sender'}
                                </span>
                                <span class="text-xs ${response.isOwner ? 'text-green-600' : 'text-gray-600'}">
                                    ${response.timestamp?.toDate?.()?.toLocaleString()}
                                </span>
                            </div>
                            <p class="text-gray-800">${response.content}</p>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
        </div>
        
        <!-- Reply Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-medium mb-4">Continue the conversation</h3>
            <form id="chatReplyForm">
                <textarea id="chatReplyText" placeholder="Write your reply..." class="w-full p-3 border border-gray-300 rounded-md mb-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></textarea>
                <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">Send Reply</button>
            </form>
        </div>
    `;
    
    // Handle chat replies
    document.getElementById('chatReplyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const replyText = document.getElementById('chatReplyText').value.trim();
        if (!replyText) return;
        
        try {
            const messageRef = db.collection('messages').doc(messageData.id);
            
            await messageRef.update({
                responses: [...(messageData.responses || []), {
                    content: replyText,
                    timestamp: new Date(),
                    isOwner: false  // This is the anonymous sender replying
                }]
            });
            
            document.getElementById('chatReplyText').value = '';
            
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Error sending reply: ' + error.message);
        }
    });
}
