# AJN PDF Scan to PDF - minimal OpenCV.js API whitelist.
# This intentionally exposes only core + imgproc operations used by the document scanner.

def makeWhiteList(module_list):
    wl = {}
    for module in module_list:
        for class_name, methods in module.items():
            if class_name not in wl:
                wl[class_name] = []
            wl[class_name] += methods
    return wl

core = {
    '': ['addWeighted', 'mean', 'normalize', 'rotate'],
    'Algorithm': [],
}

imgproc = {
    '': [
        'adaptiveThreshold',
        'approxPolyDP',
        'arcLength',
        'Canny',
        'contourArea',
        'cvtColor',
        'equalizeHist',
        'findContours',
        'GaussianBlur',
        'getPerspectiveTransform',
        'isContourConvex',
        'resize',
        'threshold',
        'warpPerspective',
    ],
}

white_list = makeWhiteList([core, imgproc])
