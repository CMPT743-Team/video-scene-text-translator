# Initialize PaddleOCR instance
import paddle
paddle.utils.run_check()

import paddleocr
from paddleocr import PaddleOCR
import os
import json
import cv2

print(f"PaddleOCR version: {paddleocr.__version__}")

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False)

# read the test image as numpy.ndarray
img = cv2.imread("test_data/IMG_frame_0270.jpg")

# Run OCR inference on a sample image 
result = ocr.predict(
    input=img)

# Visualize the results and save the JSON results
for res in result:
    #res.print()
    res.save_to_img("test_output/ppocr/IMG_frame_0270_ocr.jpg")
    res.save_to_json("test_output/ppocr/IMG_frame_0270_ocr.json")

    # print the recognition results
    print("Recognized text:")
    rec_texts = res['rec_texts']
    rec_quads = res['rec_polys']
    rec_boxes = res['rec_boxes']
    rec_scores = res['rec_scores']
    score_threshold = 0.9
    ocr_results = []
    for text, quad, box, score in zip(rec_texts, rec_quads, rec_boxes, rec_scores):
        if score >= score_threshold:
            print(f"Text: {text}, Box: x_min:{box[0]}, y_min:{box[1]}, x_max:{box[2]}, y_max:{box[3]}")
            print(f"    quad points: {quad[0]}, {quad[1]}, {quad[2]}, {quad[3]}")
            # clip the text box from the image and save it
            x_min, y_min, x_max, y_max = box
            text_crop = img[y_min:y_max, x_min:x_max]
            cv2.imwrite(f"test_output/ppocr/IMG_frame_0270_text_crop_{text}.jpg", text_crop)
            width = x_max - x_min
            height = y_max - y_min
            # write this format: 'text'  [869,328,164,355]
            ocr_results.append(f"'{text}'  [{x_min}, {y_min}, {width}, {height}]")
    
    # save the OCR results in a text file
    with open("test_output/ppocr/IMG_frame_0270_ocr_results.txt", "w") as f:
        for line in ocr_results:
            f.write(line + "\n")

print("all done")
