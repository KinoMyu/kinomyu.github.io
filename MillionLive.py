from urllib.request import urlretrieve
import http.client
import json
from itertools import islice
from multiprocessing.dummy import Pool as ThreadPool
import os
import struct

pool = ThreadPool(100)

if not os.path.exists("MillionLive"):
    os.makedirs("MillionLive")

# replace with OAuth stuff later rather than use a 3rd party API
# OAuth secret in account .xml in /data/data
conn = http.client.HTTPSConnection('api.matsurihi.me', 443)
conn.request('GET', '/mltd/v1/version/latest')
r = conn.getresponse().read()
assetver = json.loads(r)['res']['version']
print("Asset version is " + str(assetver))
assetpath = json.loads(r)['res']['indexName']
#

serverURL = "https://td-assets.bn765.com"
environment = "production"
unityver = "2017.3"
osname = "Android"
baseURL = '/'.join([serverURL, str(assetver), environment, unityver, osname, ''])
manifestURL = baseURL + str(assetpath)
urlretrieve(manifestURL, 'MillionLive\\' + 'MillionLive.manifest')

def readString(myfile):
    chars = []
    while True:
        c = myfile.read(1)
        if c == b'\x93':
            return b''.join(chars).decode("ASCII")
        chars.append(c)

def geturl(link,file):
        try:
                baseDir = '\\'.join((file).split('_')[0:-1]) + '\\'
                if file[0] >= "0" and file[0] <= "9":
                        baseDir = "chara_sign_and_cards\\" + baseDir
                if file[0:4] == "blog":
                        baseDir = "blog\\" + baseDir
                if file[0:4] == "room":
                        baseDir = "room\\" + baseDir
                if file[0:4] == "ex4c":
                        baseDir = "4koma\\" + baseDir
                if file[0:4] == "exwb":
                        baseDir = "whiteboard\\" + baseDir
                if file[0:5] == "gasha":
                        baseDir = "gasha\\" + baseDir
                if file[0:5] == "stage":
                        baseDir = "stage\\" + baseDir
                if not os.path.exists('MillionLive\\' + baseDir):
                        os.makedirs('MillionLive\\' + baseDir)
                filepath = 'MillionLive\\' + baseDir + (file).split('_')[-1]
                urlretrieve(baseURL + link, filepath)
                print('Downloading to: ' + filepath + '\n', end='')
        except Exception as e:
                print(str(e) + "\n", end='')
                print(link + " failed.\n", end='')

with open('MillionLive\\' + 'MillionLive.manifest', "rb" ) as f:
        fileName = []
        hashName = []
        f.read(1)
        #print(iCount)
        while True:
                try:
                    fileTest, fileTest2 = struct.unpack('BB',f.read(2))
                    if fileTest != 0xCE:
                        h3,nSize = struct.unpack('2B',  f.read(2))
                        if (nSize == 0xD9):
                                nSize = struct.unpack('B',  f.read(1))[0]
                        #print(f.tell(),'BASE')
                        nString = readString(f)
                        #print(f.tell(),'BASE')
                        #print(nString)
                        h3,nSize = struct.unpack('BB',  f.read(2))
                        #print(h3,nSize)
                        hString = f.read(nSize).decode("ASCII")
                        #print(hString)
                        h3,nSize = struct.unpack('2B',  f.read(2))
                        #print(h3,nSize)
                        hName = f.read(nSize).decode("ASCII")
                        #if 'song3' in nString:
                        if True: # filter files here
                            print(hName, nString)
                            #print('Hello ' + str(i))
                            #fileName.append(nString)
                            #hashName.append(hName)
                except:
                        break
        pool.starmap(geturl, zip(hashName,fileName) )

