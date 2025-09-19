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

// SESSION MANAGEMENT: Track who's logged in
let currentUser = {
    profileId: null,
    displayName: null,
    isLoggedIn: false
};

// Load session from localStorage on page load
function loadSession() {
    const savedSession = localStorage.getItem('anonymousMessageSession');
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
        console.log('Session loaded:', currentUser);
    }
}

// Save session to localStorage
function saveSession() {
    localStorage.setItem('anonymousMessageSession', JSON.stringify(currentUser));
    console.log('Session saved:', currentUser);
}

// Clear session
function clearSession() {
    localStorage.removeItem('anonymousMessageSession');
    currentUser = { profileId: null, displayName: null, isLoggedIn: false };
    console.log('Session cleared');
}

// Load session when page starts
document.addEventListener('DOMContentLoaded', function() {
    loadSession();
});

// Debug logging
console.log('Firebase initialized:', firebase.apps.length > 0);

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
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                messageCount: 0
            });
            
            console.log('Profile created with ID:', docRef.id);
            
            // FIXED: Auto-login after profile creation
            currentUser = {
                profileId: docRef.id,
                displayName: displayName,
                isLoggedIn: true
            };
            saveSession();
            
            // Show success message with CORRECTED URLs
            const basePath = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
            const baseUrl = `${window.location.origin}${basePath}`;
            
            const profileUrl = `${baseUrl}/send.html?id=${docRef.id}`;
            const dashboardUrl = `${baseUrl}/dashboard.html?id=${docRef.id}`;
            
            document.getElementById('profileUrl').value = profileUrl;
            document.getElementById('dashboardLink').href = dashboardUrl;
            
            document.getElementById('createForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
        } catch (error) {
            console.error('Error creating profile:', error);
            alert('Error creating profile: ' + error.message);
            createBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>Create My Profile';
            createBtn.disabled = false;
        }
    });
}

// FIXED: Quick Login functionality
if (document.getElementById('quickLoginForm')) {
    document.getElementById('quickLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const profileId = document.getElementById('existingProfileId').value.trim();
        const passcode = document.getElementById('existingPasscode').value;
        const loginBtn = document.getElementById('loginBtn');
        
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking...';
        loginBtn.disabled = true;
        
        try {
            console.log('Attempting login with profile:', profileId);
            const doc = await db.collection('profiles').doc(profileId).get();
            
            if (doc.exists && doc.data().passcode === passcode) {
                const profileData = doc.data();
                console.log('Login successful:', profileData.displayName);
                
                // FIXED: Save session and redirect
                currentUser = {
                    profileId: profileId,
                    displayName: profileData.displayName,
                    isLoggedIn: true
                };
                saveSession();
                
                const basePath = window.location.pathname.replace('index.html', '').replace(/\/$/, '');
                window.location.href = `${basePath}/dashboard.html?id=${profileId}`;
            } else {
                alert('Invalid Profile ID or passcode. Please check your details.');
                console.log('Login failed: Invalid credentials');
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
                    
                    // FIXED: Store sender info for chat security
                    const messageData = {
                        profileId: profileId, // Receiver
                        conversationId: conversationId,
                        content: content,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        isAnonymous: true,
                        messageType: 'initial',
                        replyCount: 0,
                        // FIXED: Track participants for chat security
                        participants: {
                            receiver: profileId,
                            sender: currentUser.isLoggedIn ? currentUser.profileId : 'anonymous'
                        },
                        senderSession: currentUser.isLoggedIn ? {
                            profileId: currentUser.profileId,
                            displayName: currentUser.displayName
                        } : null
                    };
                    
                    const docRef = await db.collection('messages').add(messageData);
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

// FIXED: Dashboard functionality with session management
async function initDashboard(profileId) {
    console.log('Initializing dashboard for profile:', profileId);
    
    // Check if user is already logged in to this profile
    if (currentUser.isLoggedIn && currentUser.profileId === profileId) {
        console.log('User already logged in, skipping authentication');
        await showDashboard(profileId);
        return;
    }
    
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
                console.log('Authentication successful for:', profile.displayName);
                
                // FIXED: Save session
                currentUser = {
                    profileId: profileId,
                    displayName: profile.displayName,
                    isLoggedIn: true
                };
                saveSession();
                
                await showDashboard(profileId);
                
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

// FIXED: Show dashboard with session info
async function showDashboard(profileId) {
    // Show dashboard
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('profileDisplayName').textContent = currentUser.displayName;
    
    // Add logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt mr-2"></i>Logout';
    logoutBtn.className = 'bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 ml-4';
    logoutBtn.onclick = function() {
        clearSession();
        window.location.href = 'index.html';
    };
    
    const headerDiv = document.getElementById('profileDisplayName').parentElement;
    if (!headerDiv.querySelector('.logout-btn')) {
        logoutBtn.classList.add('logout-btn');
        headerDiv.appendChild(logoutBtn);
    }
    
    // Correct URL generation
    const basePath = window.location.pathname.replace('dashboard.html', '').replace(/\/$/, '');
    const shareUrl = `${window.location.origin}${basePath}/send.html?id=${profileId}`;
    document.getElementById('shareUrl').value = shareUrl;
    
    // Load messages with session context
    loadMessagesWithSession(profileId);
}

// FIXED: Load messages with session-aware display
function loadMessagesWithSession(profileId) {
    console.log('Loading messages for profile:', profileId, 'Current user:', currentUser);
    
    db.collection('messages')
        .where('profileId', '==', profileId)
        .onSnapshot(async function(querySnapshot) {
            console.log('Query snapshot received, size:', querySnapshot.size);
            
            const messages = [];
            
            // Process each message and fetch its replies
            const messagePromises = querySnapshot.docs.map(async (doc) => {
                const messageData = { id: doc.id, ...doc.data() };
                
                // Fetch replies from subcollection
                try {
                    const repliesSnapshot = await db.collection('messages')
                        .doc(doc.id)
                        .collection('replies')
                        .orderBy('timestamp', 'asc')
                        .get();
                    
                    messageData.replies = [];
                    repliesSnapshot.forEach(replyDoc => {
                        const replyData = { id: replyDoc.id, ...replyDoc.data() };
                        
                        // FIXED: Add context about who sent the reply
                        if (replyData.senderProfileId === currentUser.profileId) {
                            replyData.isCurrentUser = true;
                        }
                        
                        messageData.replies.push(replyData);
                    });
                    
                    console.log('Message with replies loaded:', messageData.id, 'replies:', messageData.replies.length);
                } catch (replyError) {
                    console.log('Error loading replies for message', doc.id, replyError);
                    messageData.replies = [];
                }
                
                return messageData;
            });
            
            // Wait for all messages and their replies to load
            const loadedMessages = await Promise.all(messagePromises);
            
            // Sort messages by timestamp
            loadedMessages.sort((a, b) => {
                const timeA = a.timestamp?.toDate?.() || a.createdAt?.toDate?.() || new Date();
                const timeB = b.timestamp?.toDate?.() || b.createdAt?.toDate?.() || new Date();
                return timeB - timeA;
            });
            
            console.log('All messages loaded:', loadedMessages.length);
            document.getElementById('messageCount').textContent = `${loadedMessages.length} message${loadedMessages.length !== 1 ? 's' : ''}`;
            
            if (loadedMessages.length === 0) {
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
                displayMessagesWithSession(loadedMessages);
            }
        }, function(error) {
            console.error('Error loading messages:', error);
        });
}

// FIXED: Display messages with session-aware naming
function displayMessagesWithSession(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) {
        console.error('Messages container not found');
        return;
    }
    
    container.innerHTML = '';
    console.log('Displaying', messages.length, 'messages');
    
    messages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white rounded-2xl shadow-lg p-6 mb-6';
        
        const basePath = window.location.pathname.replace('dashboard.html', '').replace(/\/$/, '');
        const chatLink = message.conversationId ? 
            `${window.location.origin}${basePath}/chat.html?conv=${message.conversationId}` : 
            null;
        
        // Format timestamp safely
        let timeString = 'Just now';
        try {
            if (message.timestamp && message.timestamp.toDate) {
                timeString = message.timestamp.toDate().toLocaleString();
            } else if (message.createdAt && message.createdAt.toDate) {
                timeString = message.createdAt.toDate().toLocaleString();
            }
        } catch (e) {
            console.log('Error formatting timestamp:', e);
        }
        
        // FIXED: Check if this message was sent by current user
        const isFromCurrentUser = message.senderSession && message.senderSession.profileId === currentUser.profileId;
        const senderName = isFromCurrentUser ? `${currentUser.displayName} (You)` : 'Anonymous User';
        const senderColor = isFromCurrentUser ? 'from-green-500 to-blue-500' : 'from-purple-500 to-pink-500';
        
        messageDiv.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gradient-to-r ${senderColor} rounded-full flex items-center justify-center">
                        <i class="fas ${isFromCurrentUser ? 'fa-user' : 'fa-user-secret'} text-white"></i>
                    </div>
                    <div>
                        <span class="font-semibold text-gray-800">${senderName}</span>
                        <div class="text-sm text-gray-500">${timeString}</div>
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
                <p class="text-gray-800 text-lg leading-relaxed">${message.content || 'No content'}</p>
            </div>
            
            ${message.replies && message.replies.length > 0 ? `
                <div class="bg-blue-50 rounded-xl p-4 mb-4 border-l-4 border-blue-400">
                    <h4 class="text-sm font-semibold mb-3 text-blue-800 flex items-center">
                        <i class="fas fa-comments mr-2"></i>
                        Conversation (${message.replies.length} ${message.replies.length === 1 ? 'reply' : 'replies'})
                    </h4>
                    <div class="space-y-3">
                        ${message.replies.slice(-3).map(reply => {
                            let replyTime = 'Just now';
                            try {
                                if (reply.timestamp && reply.timestamp.toDate) {
                                    replyTime = reply.timestamp.toDate().toLocaleString();
                                }
                            } catch (e) {
                                console.log('Error formatting reply timestamp:', e);
                            }
                            
                            // FIXED: Show current user's name in their own replies
                            const isOwnerReply = reply.sender === 'owner';
                            const isCurrentUserReply = reply.isCurrentUser;
                            const replyerName = isOwnerReply ? 'You' : 
                                              isCurrentUserReply ? `${currentUser.displayName} (You)` : 'Anonymous';
                            
                            return `
                            <div class="${(isOwnerReply || isCurrentUserReply) ? 'bg-green-100 border-l-4 border-green-400' : 'bg-white border-l-4 border-gray-300'} p-3 rounded">
                                <div class="flex justify-between text-xs text-gray-600 mb-1">
                                    <span class="font-medium">${replyerName}</span>
                                    <span>${replyTime}</span>
                                </div>
                                <p class="text-gray-800">${reply.content || 'No content'}</p>
                            </div>
                        `;
                        }).join('')}
                    </div>
                    ${message.replies.length > 3 ? `
                        <div class="text-center mt-3">
                            <a href="${chatLink}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                View all ${message.replies.length} replies →
                            </a>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <div id="reply-${message.id}" class="hidden bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <div class="flex items-center mb-3">
                    <i class="fas fa-reply mr-2 text-blue-600"></i>
                    <span class="font-semibold text-blue-800">Reply as ${currentUser.displayName}</span>
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

// FIXED: Send reply with session info
async function sendReply(messageId) {
    const replyText = document.getElementById(`replyText-${messageId}`).value.trim();
    if (!replyText) return;
    
    try {
        console.log('Sending reply to message:', messageId);
        
        // FIXED: Save reply with sender info
        await db.collection('messages')
            .doc(messageId)
            .collection('replies')
            .add({
                content: replyText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                sender: 'owner', // Profile owner replying
                senderProfileId: currentUser.profileId,
                senderDisplayName: currentUser.displayName
            });
        
        // Update reply count in main message document
        await db.collection('messages')
            .doc(messageId)
            .update({
                replyCount: firebase.firestore.FieldValue.increment(1),
                lastReplyAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('Reply sent successfully');
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
                        <span>📅 Created ${profile.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
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

// FIXED: Secure chat functionality - only participants can reply
async function initChat(conversationId) {
    try {
        console.log('Loading chat for conversation:', conversationId);
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
            // Load replies from subcollection
            const repliesSnapshot = await db.collection('messages')
                .doc(messageData.id)
                .collection('replies')
                .orderBy('timestamp', 'asc')
                .get();
            
            messageData.replies = [];
            repliesSnapshot.forEach(replyDoc => {
                messageData.replies.push({
                    id: replyDoc.id,
                    ...replyDoc.data()
                });
            });
            
            // FIXED: Check if current user can participate
            const canParticipate = checkChatParticipation(messageData);
            
            displaySecureChatConversation(messageData, canParticipate);
            
            // Listen for new replies in real-time
            db.collection('messages')
                .doc(messageData.id)
                .collection('replies')
                .orderBy('timestamp', 'asc')
                .onSnapshot(repliesSnapshot => {
                    messageData.replies = [];
                    repliesSnapshot.forEach(replyDoc => {
                        messageData.replies.push({
                            id: replyDoc.id,
                            ...replyDoc.data()
                        });
                    });
                    displaySecureChatConversation(messageData, canParticipate);
                });
        }
        
    } catch (error) {
        console.error('Error loading chat:', error);
        document.getElementById('chatContainer').innerHTML = `
            <div class="text-center py-16">
                <div class="text-red-500 text-6xl mb-4">❌</div>
                <h3 class="text-xl font-medium text-gray-600 mb-2">Error loading conversation</h3>
                <p class="text-gray-500">Please try again later: ${error.message}</p>
            </div>
        `;
    }
}

// FIXED: Check if current user can participate in chat
function checkChatParticipation(messageData) {
    if (!currentUser.isLoggedIn) {
        return { canReply: false, reason: 'not_logged_in' };
    }
    
    // Check if user is the receiver (profile owner)
    if (currentUser.profileId === messageData.profileId) {
        return { canReply: true, role: 'receiver' };
    }
    
    // Check if user is the original sender
    if (messageData.senderSession && messageData.senderSession.profileId === currentUser.profileId) {
        return { canReply: true, role: 'sender' };
    }
    
    return { canReply: false, reason: 'not_participant' };
}

// FIXED: Display secure chat with participation control
function displaySecureChatConversation(messageData, participationInfo) {
    const container = document.getElementById('chatContainer');
    
    let startDate = 'Recently';
    try {
        if (messageData.timestamp && messageData.timestamp.toDate) {
            startDate = messageData.timestamp.toDate().toLocaleDateString();
        }
    } catch (e) {
        console.log('Error formatting chat date:', e);
    }
    
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-800">Anonymous Conversation</h2>
                <span class="text-sm text-gray-500">Started ${startDate}</span>
            </div>
            
            <div class="space-y-4">
                <!-- Original Message -->
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-medium text-blue-700">
                            ${participationInfo.role === 'sender' ? `${currentUser.displayName} (You)` : 'Anonymous Sender'}
                        </span>
                        <span class="text-xs text-blue-600">${startDate}</span>
                    </div>
                    <p class="text-gray-800">${messageData.content || 'No content'}</p>
                </div>
                
                <!-- Replies from subcollection -->
                <div id="chatResponses" class="space-y-3">
                    ${messageData.replies ? messageData.replies.map(reply => {
                        let replyTime = 'Just now';
                        try {
                            if (reply.timestamp && reply.timestamp.toDate) {
                                replyTime = reply.timestamp.toDate().toLocaleString();
                            }
                        } catch (e) {
                            console.log('Error formatting reply timestamp:', e);
                        }
                        
                        // FIXED: Show proper names based on current user context
                        let replyerName = 'Anonymous';
                        let isCurrentUserReply = false;
                        
                        if (reply.senderProfileId === currentUser.profileId) {
                            replyerName = `${currentUser.displayName} (You)`;
                            isCurrentUserReply = true;
                        } else if (reply.sender === 'owner') {
                            replyerName = participationInfo.role === 'receiver' ? `${currentUser.displayName} (You)` : 'Profile Owner';
                        }
                        
                        return `
                        <div class="${isCurrentUserReply ? 'bg-green-50 border-l-4 border-green-400' : 'bg-gray-50 border-l-4 border-gray-400'} p-4 rounded">
                            <div class="flex justify-between items-start mb-2">
                                <span class="font-medium ${isCurrentUserReply ? 'text-green-700' : 'text-gray-700'}">
                                    ${replyerName}
                                </span>
                                <span class="text-xs ${isCurrentUserReply ? 'text-green-600' : 'text-gray-600'}">
                                    ${replyTime}
                                </span>
                            </div>
                            <p class="text-gray-800">${reply.content || 'No content'}</p>
                        </div>
                    `;
                    }).join('') : ''}
                </div>
            </div>
        </div>
        
        <!-- Reply Form or View-Only Message -->
        ${participationInfo.canReply ? `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-medium mb-4">Continue the conversation as ${currentUser.displayName}</h3>
                <form id="chatReplyForm">
                    <textarea id="chatReplyText" placeholder="Write your reply..." class="w-full p-3 border border-gray-300 rounded-md mb-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" required></textarea>
                    <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">Send Reply</button>
                </form>
            </div>
        ` : `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                    <div class="flex items-center">
                        <i class="fas fa-eye text-yellow-600 mr-2"></i>
                        <h3 class="font-semibold text-yellow-800">View-Only Mode</h3>
                    </div>
                    <p class="text-yellow-700 text-sm mt-2">
                        ${participationInfo.reason === 'not_logged_in' 
                            ? 'You need to be logged in to participate in this conversation.' 
                            : 'Only the original participants can reply in this conversation.'}
                    </p>
                </div>
            </div>
        `}
    `;
    
    // Handle chat replies only if user can participate
    if (participationInfo.canReply) {
        document.getElementById('chatReplyForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const replyText = document.getElementById('chatReplyText').value.trim();
            if (!replyText) return;
            
            try {
                // FIXED: Add reply with sender info
                const senderType = participationInfo.role === 'receiver' ? 'owner' : 'anonymous';
                
                await db.collection('messages')
                    .doc(messageData.id)
                    .collection('replies')
                    .add({
                        content: replyText,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        sender: senderType,
                        senderProfileId: currentUser.profileId,
                        senderDisplayName: currentUser.displayName
                    });
                
                // Update reply count
                await db.collection('messages')
                    .doc(messageData.id)
                    .update({
                        replyCount: firebase.firestore.FieldValue.increment(1),
                        lastReplyAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                
                document.getElementById('chatReplyText').value = '';
                
            } catch (error) {
                console.error('Error sending reply:', error);
                alert('Error sending reply: ' + error.message);
            }
        });
    }
}


